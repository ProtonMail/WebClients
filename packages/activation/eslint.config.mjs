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
]);
