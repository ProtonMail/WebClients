import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';

export default defineConfig([
    defaultConfig,
    {
        rules: {
            'react/prop-types': 'off',
            'react-hooks/exhaustive-deps': 'warn',
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
            // TODO: Migrate same-package imports to relative paths and remove this rule
            'custom-rules/no-package-self-import': 'off',
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
