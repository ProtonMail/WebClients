import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { createBarrelConfig } from '@proton/eslint-config-proton/barrel';
import { extraneousDependenciesDevDependencies } from '@proton/eslint-config-proton/extraneousDependencies';
import { iconRestrictedImports } from '@proton/eslint-config-proton/icon';

export default defineConfig([
    defaultConfig,
    createBarrelConfig(),
    {
        rules: {
            '@typescript-eslint/no-restricted-imports': ['error', { paths: iconRestrictedImports }],
        },
    },
    {
        ignores: ['testing/vitest/**'],
    },
    {
        files: ['testing/**'],
        rules: {
            'import/no-extraneous-dependencies': [
                'error',
                {
                    devDependencies: [...extraneousDependenciesDevDependencies, '**/testing/**'],
                    optionalDependencies: false,
                },
            ],
            'import/no-internal-modules': 'off',
        },
    },
]);
