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
            // TODO: Add the missing explicit deps and remove this rule
            'import/no-extraneous-dependencies': 'off',
            // TODO: Migrate same-package imports to relative paths and remove this rule
            'custom-rules/no-package-self-import': 'off',
        },
    },
    globalIgnores(['fathom/', 'asm/', 'docs/starlight/']),
]);
