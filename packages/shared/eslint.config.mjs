import { defineConfig, globalIgnores } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';

export default defineConfig(
    defaultConfig,
    {
        rules: {
            'import/no-unresolved': [
                'error',
                {
                    ignore: ['design-system'],
                },
            ],
            // TODO: Add the missing explicit deps and remove this rule
            'import/no-extraneous-dependencies': 'off',
        },
    },
    globalIgnores(['test/**/*data.js'])
);
