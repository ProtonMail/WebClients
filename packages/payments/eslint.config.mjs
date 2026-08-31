import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';

export default defineConfig([
    defaultConfig,
    {
        rules: {
            'import/no-internal-modules': [
                'error',
                {
                    forbid: ['@proton/payments', '@proton/payments/**'],
                },
            ],
            'no-restricted-syntax': [
                'error',
                {
                    selector: "VariableDeclarator[id.type='ObjectPattern'][init.name=/^[A-Z_]+$/]",
                    message:
                        'Destructuring of enum-like constants is not allowed. Use CONSTANT.PROPERTY instead to maintain code readability.',
                },
            ],
        },
    },
    {
        files: ['testing/**'],
        rules: {
            'import/no-internal-modules': 'off',
            'import/no-extraneous-dependencies': 'off',
        },
    },
    {
        files: ['**/*.test.ts', '**/*.test.tsx'],
        rules: {
            'custom-rules/no-package-self-import': 'off',
            'import/no-extraneous-dependencies': 'off',
            'import/no-internal-modules': 'off',
        },
    },
]);
