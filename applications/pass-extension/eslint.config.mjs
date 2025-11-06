import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { createBarrelConfig } from '@proton/eslint-config-proton/barrel';

export default defineConfig([
    {
        files: ['src/**/*'],
        extends: [
            defaultConfig,
            createBarrelConfig(),
            {
                rules: {
                    'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
                    curly: ['error', 'multi-line'],
                    // TODO: Add the missing explicit deps and remove this rule
                    'import/no-extraneous-dependencies': 'off',
                },
            },
        ],
    },
]);
