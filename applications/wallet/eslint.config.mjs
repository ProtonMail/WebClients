import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';

export default defineConfig([
    defaultConfig,
    {
        files: ['**/*.test.ts'],
        rules: {
            'max-classes-per-file': 'off',
            'class-methods-use-this': 'off',
        },
    },
    { ignores: ['**/.eslintrc.js', 'assets/sandbox.js', '**/pkg/'] },
]);
