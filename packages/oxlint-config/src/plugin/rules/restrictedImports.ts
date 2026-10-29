import type { Context, ESTree } from '@oxlint/plugins';
import { defineRule } from '@oxlint/plugins';
import ignore from 'ignore';

import type { RestrictedImportsOptions, RestrictedPath, RestrictedPattern } from '../../restrictedImports.ts';
import { OXLINT_BASE_RESTRICTIONS, collectRestrictions, rolloutIds } from '../../restrictedImports.ts';
import { getRuleOptions } from '../utils/ruleOptions.ts';

const NAMESPACE_IMPORT = '*';

interface ImportedName {
    name: string;
    node: ESTree.Node;
    isTypeOnly: boolean;
}

interface ModuleReference {
    source: ESTree.StringLiteral;
    importedNames: ImportedName[];
    isTypeOnly: boolean;
}

const getModuleExportName = (name: ESTree.ModuleExportName) => (name.type === 'Literal' ? name.value : name.name);

const formatCustomMessage = (message: string | undefined) => (message ? ` ${message}` : '');

function getImportReference(node: ESTree.ImportDeclaration): ModuleReference {
    const isTypeOnly = node.importKind === 'type';
    const importedNames = node.specifiers.map((specifier): ImportedName => {
        if (specifier.type === 'ImportDefaultSpecifier') {
            return { name: 'default', node: specifier, isTypeOnly };
        }
        if (specifier.type === 'ImportNamespaceSpecifier') {
            return { name: NAMESPACE_IMPORT, node: specifier, isTypeOnly };
        }
        return {
            name: getModuleExportName(specifier.imported),
            node: specifier,
            isTypeOnly: isTypeOnly || specifier.importKind === 'type',
        };
    });
    return { source: node.source, importedNames, isTypeOnly };
}

function getExportAllReference(node: ESTree.ExportAllDeclaration): ModuleReference {
    const isTypeOnly = node.exportKind === 'type';
    return { source: node.source, importedNames: [{ name: NAMESPACE_IMPORT, node, isTypeOnly }], isTypeOnly };
}

function getExportNamedReference(node: ESTree.ExportNamedDeclaration, source: ESTree.StringLiteral): ModuleReference {
    const isTypeOnly = node.exportKind === 'type';
    const importedNames = node.specifiers.map((specifier): ImportedName => ({
        name: getModuleExportName(specifier.local),
        node: specifier,
        isTypeOnly: isTypeOnly || specifier.exportKind === 'type',
    }));
    return { source, importedNames, isTypeOnly };
}

function reportNamedRestrictions(
    context: Context,
    reference: ModuleReference,
    importNames: string[],
    customMessage: string | undefined,
    viaPattern: boolean
) {
    const importSource = reference.source.value;
    for (const imported of reference.importedNames) {
        if (imported.name === NAMESPACE_IMPORT) {
            context.report({
                node: imported.node,
                messageId: viaPattern ? 'everythingWithPattern' : 'everything',
                data: {
                    importSource,
                    importNames: importNames.join(', '),
                    customMessage: formatCustomMessage(customMessage),
                },
            });
        } else if (importNames.includes(imported.name)) {
            context.report({
                node: imported.node,
                messageId: viaPattern ? 'importNameWithPattern' : 'importName',
                data: { importSource, importName: imported.name, customMessage: formatCustomMessage(customMessage) },
            });
        }
    }
}

function isAllowedTypeImport(reference: ModuleReference) {
    return (
        reference.isTypeOnly ||
        (reference.importedNames.length > 0 && reference.importedNames.every((imported) => imported.isTypeOnly))
    );
}

function checkPaths(context: Context, reference: ModuleReference, paths: RestrictedPath[]) {
    for (const path of paths) {
        if (path.name !== reference.source.value || (path.allowTypeImports && isAllowedTypeImport(reference))) {
            continue;
        }
        if (path.importNames) {
            reportNamedRestrictions(context, reference, path.importNames, path.message, false);
        } else {
            context.report({
                node: reference.source,
                messageId: 'path',
                data: { importSource: path.name, customMessage: formatCustomMessage(path.message) },
            });
        }
    }
}

interface CompiledPattern extends RestrictedPattern {
    matches: (importSource: string) => boolean;
}

const compilePattern = (pattern: RestrictedPattern): CompiledPattern => {
    const matcher = ignore({ allowRelativePaths: true, ignorecase: !pattern.caseSensitive }).add(pattern.group);
    return { ...pattern, matches: (importSource) => matcher.ignores(importSource) };
};

function checkPatterns(context: Context, reference: ModuleReference, patterns: CompiledPattern[]) {
    const importSource = reference.source.value;
    for (const pattern of patterns) {
        if (!pattern.matches(importSource) || (pattern.allowTypeImports && isAllowedTypeImport(reference))) {
            continue;
        }
        if (pattern.importNames) {
            reportNamedRestrictions(context, reference, pattern.importNames, pattern.message, true);
        } else {
            context.report({
                node: reference.source,
                messageId: 'patterns',
                data: { importSource, customMessage: formatCustomMessage(pattern.message) },
            });
        }
    }
}

/**
 * The oxlint side of `proton/restricted-imports`: same options as the ESLint rule, merged the same way by
 * `collectRestrictions`, plus `OXLINT_BASE_RESTRICTIONS`. Matching is a port of ESLint's `no-restricted-imports`,
 * limited to the options Proton's configs use, plus `allowTypeImports` from `@typescript-eslint/no-restricted-imports`.
 */
export default defineRule({
    meta: {
        type: 'suggestion',
        docs: { description: 'Disallow specified modules or names when loaded by `import` or `export ... from`' },
        messages: {
            path: "'{{importSource}}' import is restricted from being used.{{customMessage}}",
            patterns: "'{{importSource}}' import is restricted from being used by a pattern.{{customMessage}}",
            importName: "'{{importName}}' import from '{{importSource}}' is restricted.{{customMessage}}",
            importNameWithPattern:
                "'{{importName}}' import from '{{importSource}}' is restricted from being used by a pattern.{{customMessage}}",
            everything:
                "* import is invalid because '{{importNames}}' from '{{importSource}}' is restricted.{{customMessage}}",
            everythingWithPattern:
                "* import is invalid because '{{importNames}}' from '{{importSource}}' is restricted from being used by a pattern.{{customMessage}}",
        },
        schema: [
            {
                type: 'object',
                properties: {
                    rollout: { type: 'array', items: { enum: rolloutIds }, uniqueItems: true },
                    paths: { type: 'array' },
                    patterns: { type: 'array' },
                },
                additionalProperties: false,
            },
        ],
    },
    create(context) {
        const [options = {}] = getRuleOptions<readonly [RestrictedImportsOptions?]>(context);
        const restrictions = collectRestrictions(context.filename, options);
        const paths = [...(OXLINT_BASE_RESTRICTIONS.paths ?? []), ...restrictions.paths];
        const compiledPatterns = [...(OXLINT_BASE_RESTRICTIONS.patterns ?? []), ...restrictions.patterns].map(
            compilePattern
        );

        const check = (reference: ModuleReference) => {
            checkPaths(context, reference, paths);
            checkPatterns(context, reference, compiledPatterns);
        };

        return {
            ImportDeclaration(node) {
                check(getImportReference(node));
            },
            ExportAllDeclaration(node) {
                check(getExportAllReference(node));
            },
            ExportNamedDeclaration(node) {
                if (node.source) {
                    check(getExportNamedReference(node, node.source));
                }
            },
        };
    },
});
