import { defineConfig, globalIgnores } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';

export default defineConfig(
    defaultConfig,
    {
        rules: {
            '@typescript-eslint/no-unused-expressions': 'off',
        },
    },
    globalIgnores(['scripts', 'test'])
);
