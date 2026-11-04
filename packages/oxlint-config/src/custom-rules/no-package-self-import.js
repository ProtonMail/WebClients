import fs from 'node:fs';
import path from 'node:path';

/** Keyed by directory, so sibling files in the same folder resolve the package name once. */
const packageNameCache = new Map();

const findNearestPackageName = (startDir) => {
    if (packageNameCache.has(startDir)) {
        return packageNameCache.get(startDir);
    }

    let current = startDir;

    while (true) {
        const packageJsonPath = path.join(current, 'package.json');

        if (fs.existsSync(packageJsonPath)) {
            try {
                const { name } = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

                if (name) {
                    packageNameCache.set(startDir, name);
                    return name;
                }
            } catch {
                // Unreadable or malformed package.json: keep walking up.
            }
        }

        const parent = path.dirname(current);

        if (parent === current) {
            packageNameCache.set(startDir, null);
            return null;
        }

        current = parent;
    }
};

/** @type {import('eslint').Rule.RuleModule} */
export default {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Forbid a package from importing itself by its own npm name; use a relative path instead',
        },
        schema: [],
        messages: {
            selfImport:
                '"{{importPath}}" is a self-reference to the current package "{{packageName}}". Use a relative import instead.',
        },
    },
    create: (context) => {
        const filename = context.physicalFilename ?? context.filename;
        const packageName = findNearestPackageName(path.dirname(filename));

        if (!packageName) {
            return {};
        }

        const check = (node, importPath) => {
            if (typeof importPath !== 'string') {
                return;
            }

            // `${packageName}/` guards against matching a package whose name merely
            // starts with this one, e.g. `@proton/pass` vs `@proton/pass-docs`.
            if (importPath !== packageName && !importPath.startsWith(`${packageName}/`)) {
                return;
            }

            context.report({
                node,
                messageId: 'selfImport',
                data: { importPath, packageName },
            });
        };

        const checkSource = (node) => {
            if (node.source) {
                check(node.source, node.source.value);
            }
        };

        return {
            // `importKind` is deliberately not checked: a type-only self-import still routes
            // through the package entrypoint and can drag a barrel file into the module graph.
            ImportDeclaration: checkSource,
            ExportAllDeclaration: checkSource,
            ExportNamedDeclaration: checkSource,
            // `let x: import('pkg').Foo`. `source` is the string literal; `argument` is its
            // pre-v8 typescript-eslint name, kept so older parsers stay covered.
            TSImportType: (node) => {
                const source = node.source ?? node.argument;

                if (source?.type === 'Literal') {
                    check(source, source.value);
                }
            },
            // `import Foo = require('pkg')`.
            TSImportEqualsDeclaration: (node) => {
                const { moduleReference } = node;

                if (moduleReference?.type === 'TSExternalModuleReference') {
                    check(moduleReference.expression, moduleReference.expression?.value);
                }
            },
            ImportExpression: (node) => {
                if (node.source?.type === 'Literal') {
                    check(node.source, node.source.value);
                }
            },
            // Only bare `require(...)` is treated as an import. `require.resolve(...)` and
            // `jest.mock(...)` are deliberately excluded: they resolve or stub a path without
            // creating a module-graph edge, so they cannot introduce a dependency cycle.
            CallExpression: (node) => {
                if (node.callee.type !== 'Identifier' || node.callee.name !== 'require') {
                    return;
                }

                const [argument] = node.arguments;

                if (argument?.type === 'Literal') {
                    check(argument, argument.value);
                }
            },
        };
    },
};
