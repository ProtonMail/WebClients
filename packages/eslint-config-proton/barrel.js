import { defineConfig } from 'eslint/config';

import { allGlobs } from './globs.js';

export const atomsPackage = '@proton/atoms';
export const componentsPackage = '@proton/components';
export const iconsPackage = '@proton/icons';

/**
 * Creates a barrel import rule configuration
 * @example
 * createBarrelConfig({ packages: [atomsPackage] })
 */
export function createBarrelConfig(options = {}) {
    const defaultPackages = [atomsPackage, componentsPackage, iconsPackage];
    if (options.packages && !Array.isArray(options.packages)) {
        throw new Error('packages must be an array');
    }

    const packages = options.packages || defaultPackages;

    return defineConfig({
        name: 'barrel-import-rules',
        files: allGlobs,
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    paths: packages.map((name) => ({
                        name,
                        message: 'You should avoid barrel imports. Prefer full path imports.',
                    })),
                },
            ],
        },
    });
}

// Default export with all packages for backward compatibility
export default createBarrelConfig({ packages: ['@proton/atoms', '@proton/components', '@proton/icons'] });
