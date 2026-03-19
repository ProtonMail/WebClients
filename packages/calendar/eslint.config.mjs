import { defineConfig } from 'eslint/config';

import config from '@proton/eslint-config-proton/all';

export default defineConfig([
    config,
    {
        rules: {
            // TODO: Add the missing explicit deps and remove this rule
            'import/no-extraneous-dependencies': 'off',
            // TODO: Remove this rule once the cycle dependency is fixed
            'import/no-cycle': 'off',
        },
    },
]);
