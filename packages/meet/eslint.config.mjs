import { defineConfig } from 'eslint/config';

import config from '@proton/eslint-config-proton/all';

export default defineConfig([
    config,
    {
        rules: {
            // TODO: Add the missing explicit deps and remove this rule
            'import/no-extraneous-dependencies': 'off',
            'react-hooks/exhaustive-deps': 'warn',
            // TODO: Remove this rule once the compat issue is resolved
            'compat/compat': 'off',
            // TODO: Migrate same-package imports to relative paths and remove this rule
            'custom-rules/no-package-self-import': 'off',
        },
    },
]);
