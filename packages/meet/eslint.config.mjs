import { defineConfig } from 'eslint/config';

import config from '@proton/eslint-config-proton/all';

export default defineConfig([
    config,
    {
        rules: {
            'react-hooks/exhaustive-deps': 'warn',
            // TODO: Remove this rule once the compat issue is resolved
            'compat/compat': 'off',
        },
    },
    {
        files: ['testing/setup/**'],
        rules: {
            'import/no-extraneous-dependencies': ['error', { devDependencies: ['**/testing/**'] }],
        },
    },
]);
