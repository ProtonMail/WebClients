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
            'jsx-a11y/alt-text': 'off',
            'react/prop-types': 'off',
            'monorepo-cop/no-disable-monorepo-no-relative-rule': 'off',
            'monorepo-cop/no-relative-import-outside-package': 'off',
            // TODO: Remove this rule once the compat issue is resolved
            'compat/compat': 'off',
            'no-nested-ternary': 'off',
        },
    },
    {
        // Local development tools (slides eval runners, preview comparison) that never ship. They use
        // packages hoisted in the monorepo (playwright, esbuild, @napi-rs/canvas, @xmldom/xmldom)
        // rather than adding them to Lumo's dependencies. Both path forms are listed because
        // lint-staged runs ESLint from the repo root with repo-relative paths.
        files: ['dev/**', '**/lumo/dev/**'],
        rules: {
            'import/no-extraneous-dependencies': 'off',
        },
    },
]);
