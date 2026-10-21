import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';

export default defineConfig([
    {
        files: ['src/**/*'],
        extends: [
            defaultConfig,
            {
                rules: {
                    'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
                    curly: ['error', 'multi-line'],
                    // TODO: Remove this rule once the compat issue is resolved
                    'compat/compat': 'off',
                },
            },
        ],
    },
]);
