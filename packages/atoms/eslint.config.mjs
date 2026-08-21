import storybookConfig from 'eslint-plugin-storybook';
import { defineConfig, globalIgnores } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { createBarrelConfig } from '@proton/eslint-config-proton/barrel';
import { extraneousDependenciesDevDependencies } from '@proton/eslint-config-proton/extraneousDependencies';

export default defineConfig([
    defaultConfig,
    createBarrelConfig(),
    storybookConfig.configs['flat/recommended'],
    // create-atom is a dev-only CLI; allow its devDependencies (commander, prettier, mustache).
    // Flat config replaces rule options per file glob, so we extend the shared allowlist here.
    // Both globs need the `**/` prefix, since they resolve against cwd rather than this file:
    // a bare `create-atom/**` only matches when ESLint is invoked from this package.
    {
        files: ['**/create-atom/**'],
        rules: {
            'import/no-extraneous-dependencies': [
                'error',
                {
                    devDependencies: [...extraneousDependenciesDevDependencies, '**/create-atom/**'],
                    optionalDependencies: false,
                    peerDependencies: true,
                },
            ],
        },
    },
    {
        rules: {
            'import/no-internal-modules': ['error', { forbid: ['@proton/atoms'] }],
            'no-restricted-imports': [
                'error',
                { patterns: [{ group: ['@proton/components', '@proton/components/*'], message: 'atoms must not depend on @proton/components' }] },
            ],
        },
    },
    globalIgnores(['.storybook']),
]);
