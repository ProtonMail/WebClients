import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';

export default defineConfig([
    defaultConfig,
    {
        rules: {
            'no-console': 'off',
            'no-nested-ternary': 'off',
            '@typescript-eslint/no-misused-promises': 'off',
            'react-hooks/exhaustive-deps': 'error',
            'no-restricted-syntax': [
                'error',
                {
                    selector: "VariableDeclarator[id.type='ObjectPattern'][init.name=/^[A-Z_]+$/]",
                    message:
                        'Destructuring of enum-like constants is not allowed. Use CONSTANT.PROPERTY instead to maintain code readability.',
                },
            ],
            // TODO: Add the missing explicit deps and remove this rule
            'import/no-extraneous-dependencies': 'off',
        },
    },
]);
