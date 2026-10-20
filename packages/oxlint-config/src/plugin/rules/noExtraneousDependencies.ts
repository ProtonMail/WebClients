import type { ESTree } from '@oxlint/plugins';
import { defineRule } from '@oxlint/plugins';
import fs from 'node:fs';
import { isBuiltin } from 'node:module';
import path from 'node:path';

import { type PackageRoot, findPackageRoot } from '../utils/packageRoot.ts';
import { getRuleOptions } from '../utils/ruleOptions.ts';

interface ExtraneousDependenciesOptions {
    /** `true` allows devDependencies everywhere, a list of globs allows them only in matching files. */
    devDependencies?: boolean | string[];
    optionalDependencies?: boolean;
    peerDependencies?: boolean;
}

interface DeclaredDependencies {
    dependencies: Set<string>;
    devDependencies: Set<string>;
    optionalDependencies: Set<string>;
    peerDependencies: Set<string>;
    bundledDependencies: Set<string>;
}

const declaredDependenciesByPackage = new Map<string, DeclaredDependencies>();
const installedPackageByLookup = new Map<string, boolean>();

function getDeclaredDependencies({ directory, manifest }: PackageRoot): DeclaredDependencies {
    let declared = declaredDependenciesByPackage.get(directory);
    if (!declared) {
        declared = {
            dependencies: new Set(Object.keys(manifest.dependencies ?? {})),
            devDependencies: new Set(Object.keys(manifest.devDependencies ?? {})),
            optionalDependencies: new Set(Object.keys(manifest.optionalDependencies ?? {})),
            peerDependencies: new Set(Object.keys(manifest.peerDependencies ?? {})),
            bundledDependencies: new Set(manifest.bundledDependencies ?? manifest.bundleDependencies ?? []),
        };
        declaredDependenciesByPackage.set(directory, declared);
    }
    return declared;
}

function getPackageName(specifier: string) {
    if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.includes(':') || isBuiltin(specifier)) {
        return null;
    }
    const segments = specifier.split('/');
    return specifier.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0];
}

/**
 * A package is checked when it is installed somewhere up the tree, including workspace packages,
 * which are symlinks into the repository. Unlike eslint-plugin-import, undeclared workspace
 * imports are reported too: they only resolve through hoisting and break under pnpm's isolated
 * layout. Packages that are not installed at all cannot be resolved and are left to the bundler.
 */
function isInstalledPackage(fromDirectory: string, packageName: string): boolean {
    const key = `${fromDirectory}\0${packageName}`;
    const cached = installedPackageByLookup.get(key);
    if (cached !== undefined) {
        return cached;
    }
    let result: boolean;
    if (fs.existsSync(path.join(fromDirectory, 'node_modules', packageName))) {
        result = true;
    } else {
        const parent = path.dirname(fromDirectory);
        result = parent === fromDirectory ? false : isInstalledPackage(parent, packageName);
    }
    installedPackageByLookup.set(key, result);
    return result;
}

function isAllowedByGlobs(allowed: boolean | string[] | undefined, filename: string) {
    if (Array.isArray(allowed)) {
        return allowed.some((glob) => path.matchesGlob(filename, glob));
    }
    return allowed !== false;
}

const isTypeOnlyImport = (node: ESTree.ImportDeclaration) =>
    node.importKind === 'type' ||
    (node.specifiers.length > 0 &&
        node.specifiers.every((specifier) => specifier.type === 'ImportSpecifier' && specifier.importKind === 'type'));

/**
 * Port of eslint-plugin-import's `no-extraneous-dependencies`: an imported npm package must be
 * declared in the nearest package.json, and devDependencies only count in files matching the
 * `devDependencies` globs. Type-only imports are not checked, matching the original's default.
 */
export default defineRule({
    meta: {
        type: 'problem',
        docs: { description: 'Forbid the use of packages not declared in the nearest package.json' },
        messages: {
            missing:
                "'{{packageName}}' should be listed in the project's dependencies. Run 'npm i -S {{packageName}}' to add it",
            devDependency: "'{{packageName}}' should be listed in the project's dependencies, not devDependencies.",
            optionalDependency:
                "'{{packageName}}' should be listed in the project's dependencies, not optionalDependencies.",
        },
        schema: [
            {
                type: 'object',
                properties: {
                    devDependencies: { type: ['boolean', 'array'] },
                    optionalDependencies: { type: 'boolean' },
                    peerDependencies: { type: 'boolean' },
                },
                additionalProperties: false,
            },
        ],
    },
    create(context) {
        const [options = {}] = getRuleOptions<readonly [ExtraneousDependenciesOptions?]>(context);
        const directory = path.dirname(context.physicalFilename);
        const packageRoot = findPackageRoot(directory);
        if (!packageRoot) {
            return {};
        }
        const manifest = getDeclaredDependencies(packageRoot);
        const allowsDevDependencies = isAllowedByGlobs(options.devDependencies, context.physicalFilename);
        const allowsOptionalDependencies = options.optionalDependencies !== false;
        const allowsPeerDependencies = options.peerDependencies !== false;

        const check = (source: ESTree.StringLiteral) => {
            const packageName = getPackageName(source.value);
            if (
                !packageName ||
                packageName === packageRoot.manifest.name ||
                !isInstalledPackage(directory, packageName)
            ) {
                return;
            }
            if (
                manifest.dependencies.has(packageName) ||
                manifest.bundledDependencies.has(packageName) ||
                (allowsPeerDependencies && manifest.peerDependencies.has(packageName)) ||
                (allowsDevDependencies && manifest.devDependencies.has(packageName)) ||
                (allowsOptionalDependencies && manifest.optionalDependencies.has(packageName))
            ) {
                return;
            }
            let messageId = 'missing';
            if (manifest.devDependencies.has(packageName)) {
                messageId = 'devDependency';
            } else if (manifest.optionalDependencies.has(packageName)) {
                messageId = 'optionalDependency';
            }
            context.report({ node: source, messageId, data: { packageName } });
        };

        return {
            ImportDeclaration(node) {
                if (!isTypeOnlyImport(node)) {
                    check(node.source);
                }
            },
            ExportNamedDeclaration(node) {
                if (node.source && node.exportKind !== 'type') {
                    check(node.source);
                }
            },
            ExportAllDeclaration(node) {
                if (node.exportKind !== 'type') {
                    check(node.source);
                }
            },
            ImportExpression(node) {
                if (node.source.type === 'Literal' && typeof node.source.value === 'string') {
                    check(node.source as ESTree.StringLiteral);
                }
            },
            CallExpression(node) {
                const [argument] = node.arguments;
                if (
                    node.callee.type === 'Identifier' &&
                    node.callee.name === 'require' &&
                    node.arguments.length === 1 &&
                    argument.type === 'Literal' &&
                    typeof argument.value === 'string'
                ) {
                    check(argument as ESTree.StringLiteral);
                }
            },
        };
    },
});
