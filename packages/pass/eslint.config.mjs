import { defineConfig, globalIgnores } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { createBarrelConfig } from '@proton/eslint-config-proton/barrel';

export default defineConfig([
    defaultConfig,
    createBarrelConfig(),
    {
        rules: {
            'no-console': ['error', { allow: ['warn', 'error'] }],
            curly: ['error', 'multi-line'],
        },
    },
    globalIgnores(['fathom/', 'asm/', 'docs/starlight/']),
]);
