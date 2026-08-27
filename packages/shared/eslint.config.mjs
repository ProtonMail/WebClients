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
        },
    },
    globalIgnores(['tests/**/*data.js'])
);
