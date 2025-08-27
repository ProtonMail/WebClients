import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';

export default defineConfig([
    defaultConfig,
    {
        rules: {
            // 'no-console': ['warn', { allow: ['warn', 'error', 'trace'] }],
            'no-console': 'off',
            curly: ['error', 'multi-line'],
            'react/react-in-jsx-scope': 'off',
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    args: 'after-used',
                    ignoreRestSiblings: true,
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'variable',
                    format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
                    leadingUnderscore: 'allow',
                    trailingUnderscore: 'allow',
                },
                {
                    selector: 'function',
                    format: ['camelCase', 'PascalCase'],
                    leadingUnderscore: 'allow',
                    trailingUnderscore: 'allow',
                },
                {
                    selector: 'typeLike',
                    format: ['PascalCase'],
                    leadingUnderscore: 'allow',
                    trailingUnderscore: 'allow',
                },
                {
                    selector: 'enum',
                    format: ['PascalCase', 'UPPER_CASE'],
                    leadingUnderscore: 'allow',
                    trailingUnderscore: 'allow',
                },
            ],
            '@typescript-eslint/no-use-before-define': 'off',
            'custom-rules/deprecate-sizing-classes': 'off',
            'jsx-a11y/alt-text': 'off',
            'react/prop-types': 'off',
            'monorepo-cop/no-disable-monorepo-no-relative-rule': 'off',
            'monorepo-cop/no-relative-import-outside-package': 'off',
        },
    },
]);
