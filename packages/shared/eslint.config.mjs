import { defineConfig, globalIgnores } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';

export default defineConfig(
    defaultConfig,
    {
        rules: {
            'import/no-unresolved': [
                'error',
                {
                    ignore: ['design-system'],
                },
            ],
        },
    },
    {
        // @proton/calendar depends on @proton/shared, so the calendar test builders used here
        // cannot be declared as a dependency without creating a cycle. See INWEB-1236 Phase 7.
        files: ['tests/**'],
        rules: {
            'import/no-extraneous-dependencies': 'off',
        },
    },
    globalIgnores(['tests/**/*data.js'])
);
