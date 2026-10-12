import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { iconRestrictedImports } from '@proton/eslint-config-proton/icon';

export default defineConfig([
    defaultConfig,
    {
        rules: {
            '@typescript-eslint/no-restricted-imports': ['error', { paths: iconRestrictedImports }],
        },
    },
    {
        files: ['**/*.test.ts'],
        rules: {
            'max-classes-per-file': 'off',
            'class-methods-use-this': 'off',
        },
    },
    { ignores: ['**/.eslintrc.js', 'assets/sandbox.js', '**/pkg/'] },
]);
