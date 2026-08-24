import { defineConfig } from 'eslint/config';

import config from '@proton/eslint-config-proton/all';

export default defineConfig([
    config,
    {
        rules: {
            'react-hooks/exhaustive-deps': 'warn',
            // TODO: Remove this rule once the compat issue is resolved
            'compat/compat': 'off',
            // Cyclic dependency with @proton/calendar via @proton/components and @proton/redux-shared-store
            'import/no-extraneous-dependencies': 'off',
        },
    },
]);
