import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';

export default defineConfig([
    defaultConfig,
    {
        rules: {
            'no-console': ['error', { allow: ['warn', 'error'] }],
            curly: ['error', 'multi-line'],
        },
    },
]);
