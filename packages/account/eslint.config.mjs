import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { createBarrelConfig } from '@proton/eslint-config-proton/barrel';

export default defineConfig([
    defaultConfig,
    createBarrelConfig(),
    {
        ignores: ['testing/vitest/**'],
    },
    {
        files: ['testing/**'],
        rules: {
            'custom-rules/no-package-self-import': 'off',
            'import/no-internal-modules': 'off',
            'import/no-extraneous-dependencies': 'off',
        },
    },
    {
        files: ['**/*.test.ts', '**/*.test.tsx'],
        rules: {
            'custom-rules/no-package-self-import': 'off',
            'import/no-extraneous-dependencies': 'off',
            'import/no-internal-modules': 'off',
        },
    },
]);
