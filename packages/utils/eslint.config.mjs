import { defineConfig } from 'eslint/config';

import config from '@proton/eslint-config-proton/base';

export default defineConfig([
    config,
    {
        rules: {
            // TODO: Add the missing explicit deps and remove this rule
            'import/no-extraneous-dependencies': 'off',
        },
    },
]);
