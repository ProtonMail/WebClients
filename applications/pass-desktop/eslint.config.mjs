import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import barrelConfig from '@proton/eslint-config-proton/barrel';

export default defineConfig([
    defaultConfig,
    barrelConfig,
    {
        rules: {
            'no-console': ['error', { allow: ['warn', 'error'] }],
            curly: ['error', 'multi-line'],
            // TODO: Add the missing explicit deps and remove this rule
            'import/no-extraneous-dependencies': 'off',
        },
    },
]);
