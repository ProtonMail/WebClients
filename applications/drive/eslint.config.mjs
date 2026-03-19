import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';

const isFixMode = process.argv.includes('--fix');

export default defineConfig([
    defaultConfig,
    {
        rules: {
            'react/prop-types': 'off',
            ...(!isFixMode && {
                'react-hooks/exhaustive-deps': 'warn',
            }),
            '@typescript-eslint/no-non-null-assertion': 'warn',
            '@typescript-eslint/no-use-before-define': [
                'error',
                {
                    functions: false,
                    classes: false,
                },
            ],
            'no-console': [
                'warn',
                {
                    allow: ['warn', 'error'],
                },
            ],
            'max-classes-per-file': 'off',
            // TODO: Remove this rule once the cycle dependency is fixed
            'import/no-cycle': 'off',
        },
    },
    {
        files: ['**/*.test.ts'],
        rules: {
            'max-classes-per-file': 'off',
            'class-methods-use-this': 'off',
        },
    },
]);
