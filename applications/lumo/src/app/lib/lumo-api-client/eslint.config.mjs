import { defineConfig } from 'eslint/config';

import config from '@proton/eslint-config-proton/all';

// Keep in sync with applications/lumo/eslint.config.mjs so the package lints
// the same way whether run from the app root or the package directory.
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
            'import/no-extraneous-dependencies': 'off',
            'import/no-cycle': 'off',
        },
    },
]);
