import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';

export default defineConfig([
    defaultConfig,
    {
        rules: {
            // TODO: Fix exhaustiveness of deps then enable this rule
            'react-hooks/exhaustive-deps': 'off',
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
]);
