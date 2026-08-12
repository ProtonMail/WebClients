import { defineConfig } from 'eslint/config';

import { allGlobs } from './globs.js';

export const accountPackage = '@proton/account';
export const atomsPackage = '@proton/atoms';
export const componentsPackage = '@proton/components';
export const hooksPackage = '@proton/hooks';
export const iconsPackage = '@proton/icons';

const defaultPackages = [atomsPackage, componentsPackage, iconsPackage];

/**
 * Builds the `no-restricted-imports` paths banning barrel imports. Exported separately so config
 * objects that set their own `no-restricted-imports` can recompose these paths instead of losing
 * them (flat config replaces a rule's options wholesale per matching file, it doesn't merge across
 * config objects).
 * @example
 * createBarrelPaths([atomsPackage])
 */
export function createBarrelPaths(packages = defaultPackages) {
    if (!Array.isArray(packages)) {
        throw new Error('packages must be an array');
    }

    return packages.map((name) => ({
        name,
        message: 'You should avoid barrel imports. Prefer full path imports.',
    }));
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
