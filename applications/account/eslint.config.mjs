import { defineConfig } from 'eslint/config';

import config from '@proton/eslint-config-proton/all';

export default defineConfig([
    config,
    {
        rules: {
            // TODO: Remove this rule once the cycle dependency is fixed
            'import/no-cycle': 'off',
        },
    },
]);
