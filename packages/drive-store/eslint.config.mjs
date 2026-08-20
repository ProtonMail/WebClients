import { defineConfig, globalIgnores } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';

export default defineConfig([
    defaultConfig,
    {
        rules: {
            '@typescript-eslint/no-use-before-define': [
                'error',
                {
                    functions: false,
                    classes: false,
                },
            ],
            // TODO: Remove this rule once the compat issue is resolved
            'compat/compat': 'off',
        },
    },
    globalIgnores(['scripts']),
]);
