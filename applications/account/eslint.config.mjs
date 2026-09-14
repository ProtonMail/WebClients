import { defineConfig } from 'eslint/config';

import config from '@proton/eslint-config-proton/all';
import { iconRestrictedImports } from '@proton/eslint-config-proton/icon';

export default defineConfig([
    config,
    {
        rules: {
            '@typescript-eslint/no-restricted-imports': ['error', { paths: iconRestrictedImports }],
        },
    },
]);
