import { defineConfig } from 'eslint/config';

import config from '@proton/eslint-config-proton/all';

export default defineConfig([
    config,
    {
        rules: {
            'no-console': 'off',
            curly: ['error', 'multi-line'],
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
            '@typescript-eslint/no-use-before-define': 'off',
            // TODO: Remove this rule once the compat issue is resolved
            'compat/compat': 'off',
        },
    },
]);
