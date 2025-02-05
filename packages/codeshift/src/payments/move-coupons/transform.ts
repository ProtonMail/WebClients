import type { API, FileInfo, ImportSpecifier, Options } from 'jscodeshift';
import path from 'node:path';

// Define a custom type that extends ImportSpecifier
interface TypescriptImportSpecifier extends ImportSpecifier {
    importKind?: 'type' | 'value' | 'typeof';
}

interface ImportConfig {
    identifier: string;
    source: string;
    target: string;
}

const config: ImportConfig[] = [
    {
        identifier: 'COUPON_CODES',
        source: '@proton/shared/lib/constants',
        target: '@proton/payments',
    },
    {
        identifier: 'VPN_PASS_PROMOTION_COUPONS',
        source: '@proton/shared/lib/constants',
        target: '@proton/payments',
    },
];

function getPackageFromImport(importPath: string): string | undefined {
    const match = importPath.match(/^@proton\/([^/]+)/);
    return match?.[1];
}

function findRelativeImport(filePath: string, source: string): string | undefined {
    // Only process @proton/* imports
    const sourcePackage = getPackageFromImport(source);
    if (!sourcePackage) {
        return undefined;
    }

    // Get the source file path relative to packages/
    const sourcePath = source.replace(`@proton/${sourcePackage}/`, '');

    // Get the current file's directory relative to packages/
    // Remove everything up to and including 'packages/'
    const packagePath = filePath.split('packages/')[1];
    if (!packagePath) {
        return undefined;
    }

    const currentDir = path.dirname(packagePath);

    // If they're in the same package, calculate the relative path
    if (currentDir.startsWith(`${sourcePackage}/`)) {
        const relativePath = path.relative(currentDir, path.dirname(path.join(sourcePackage, sourcePath)));
        const relativeImport = path.join(relativePath || '.', path.basename(sourcePath));
        return relativeImport.startsWith('.') ? relativeImport : `./${relativeImport}`;
    }

    return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function transform(fileInfo: FileInfo, api: API, options: Options) {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);

    // Track imports to move by their target
    const importsToMove = new Map<string, { identifier: string; wasTypeImport: boolean }[]>();

    // Find and process imports from source files
    config.forEach(({ identifier, source, target }) => {
        // Find both absolute and relative imports
        const importPaths = [source];
        const relativeImport = findRelativeImport(fileInfo.path, source);
        if (relativeImport) {
            importPaths.push(relativeImport);
        }

        importPaths.forEach((importPath) => {
            const oldImports = root
                .find(j.ImportDeclaration, {
                    source: { value: importPath },
                })
                .filter((path) => {
                    return (
                        path.node.specifiers?.some(
                            (specifier) =>
                                specifier.type === 'ImportSpecifier' && specifier.imported.name === identifier
                        ) ?? false
                    );
                });

            if (oldImports.length === 0) {
                return;
            }

            // Process each import declaration
            oldImports.forEach((path) => {
                const node = path.node;
                const specifiers = node.specifiers || [];

                // Find identifier specifier to check if it was a type import
                const identifierSpecifier = specifiers.find(
                    (s) => s.type === 'ImportSpecifier' && s.imported.name === identifier
                ) as TypescriptImportSpecifier | undefined;

                if (identifierSpecifier) {
                    const wasTypeImport = path.node.importKind === 'type' || identifierSpecifier.importKind === 'type';

                    // Add to imports to move
                    const targetImports = importsToMove.get(target) || [];
                    targetImports.push({ identifier, wasTypeImport });
                    importsToMove.set(target, targetImports);
                }

                // Get other specifiers excluding the current identifier
                const otherSpecifiers = specifiers.filter(
                    (s) => s.type !== 'ImportSpecifier' || s.imported.name !== identifier
                );

                // If there are other specifiers, keep the original import but remove current identifier
                if (otherSpecifiers.length > 0) {
                    path.node.specifiers = otherSpecifiers;
                } else {
                    // If current identifier was the only import, remove the entire import declaration
                    j(path).remove();
                }
            });
        });
    });

    // Process each target and add imports
    importsToMove.forEach((imports, target) => {
        // Find existing non-type import for this target
        const targetImports = root
            .find(j.ImportDeclaration, {
                source: { value: target },
            })
            .filter((path) => path.node.importKind !== 'type');

        if (targetImports.length === 0) {
            // Create new import with all identifiers
            const specifiers = imports.map(({ identifier, wasTypeImport }) => {
                const specifier = j.importSpecifier(j.identifier(identifier)) as TypescriptImportSpecifier;
                if (wasTypeImport) {
                    specifier.importKind = 'type';
                }
                return specifier;
            });

            root.get().node.program.body.unshift(j.importDeclaration(specifiers, j.literal(target)));
        } else {
            // Add to existing import
            const existingImport = targetImports.get(0);
            imports.forEach(({ identifier, wasTypeImport }) => {
                const specifier = j.importSpecifier(j.identifier(identifier)) as TypescriptImportSpecifier;
                if (wasTypeImport) {
                    specifier.importKind = 'type';
                }
                existingImport.node.specifiers.push(specifier);
            });
        }
    });

    return root.toSource();
}

// Specify the parser to handle TypeScript and TSX files
transform.parser = 'tsx';

export default transform;
