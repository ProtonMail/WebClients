import jasminePlugin from 'eslint-plugin-jasmine';
import { defineConfig, globalIgnores } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';

export default defineConfig(
    defaultConfig,
    {
        plugins: { jasmine: jasminePlugin },
        rules: {
            'import/no-unresolved': [
                'error',
                {
                    ignore: ['design-system'],
                },
            ],
            'jasmine/no-focused-tests': 'error',
        },
    },
    globalIgnores(['test/**/*data.js'])
);
