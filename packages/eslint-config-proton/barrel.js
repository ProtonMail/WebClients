import { defineConfig } from 'eslint/config';

import { allGlobs } from './globs.js';

export const accountPackage = '@proton/account';
export const atomsPackage = '@proton/atoms';
export const componentsPackage = '@proton/components';
export const hooksPackage = '@proton/hooks';
export const iconsPackage = '@proton/icons';

const defaultPackages = [atomsPackage, componentsPackage, iconsPackage];

const barrelMessage = 'You should avoid barrel imports. Prefer full path imports.';

/**
 * Builds the `no-restricted-imports` paths banning the `/index` and `/index.ts` specifiers of barrel
 * packages. They load the same `index.ts` as the bare specifier, but `no-restricted-imports` matches
 * specifiers exactly, so a ban on the bare one alone lets them through. Exported separately for
 * packages that still allow the bare specifier.
 * @example
 * createBarrelIndexPaths([componentsPackage])
 */
export function createBarrelIndexPaths(packages = defaultPackages) {
    if (!Array.isArray(packages)) {
        throw new Error('packages must be an array');
    }

    return packages.flatMap((name) =>
        [`${name}/index`, `${name}/index.ts`].map((specifier) => ({ name: specifier, message: barrelMessage }))
    );
}

/**
 * Builds the `no-restricted-imports` paths banning barrel imports, through both the bare specifier
 * and the `createBarrelIndexPaths` ones. Exported separately so config objects that set their own
 * `no-restricted-imports` can recompose these paths instead of losing them (flat config replaces a
 * rule's options wholesale per matching file, it doesn't merge across config objects).
 * @example
 * createBarrelPaths([atomsPackage])
 */
export function createBarrelPaths(packages = defaultPackages) {
    if (!Array.isArray(packages)) {
        throw new Error('packages must be an array');
    }

    return [...packages.map((name) => ({ name, message: barrelMessage })), ...createBarrelIndexPaths(packages)];
}

/**
 * Creates a barrel import rule configuration
 * @example
 * createBarrelConfig({ packages: [atomsPackage] })
 */
export function createBarrelConfig(options = {}) {
    return defineConfig({
        name: 'barrel-import-rules',
        files: allGlobs,
        rules: {
            'no-restricted-imports': ['error', { paths: createBarrelPaths(options.packages) }],
        },
    });
}

// Default export with all packages for backward compatibility
export default createBarrelConfig({ packages: ['@proton/atoms', '@proton/components', '@proton/icons'] });
