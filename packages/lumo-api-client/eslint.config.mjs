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
            'monorepo-cop/no-disable-monorepo-no-relative-rule': 'off',
            'monorepo-cop/no-relative-import-outside-package': 'off',
            // TODO: Add the missing explicit deps and remove this rule
            'import/no-extraneous-dependencies': 'off',
            // TODO: Remove this rule once the compat issue is resolved
            'compat/compat': 'off',
        },
    },
]);
