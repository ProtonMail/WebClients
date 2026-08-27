import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';

export default defineConfig([
    defaultConfig,
    {
        rules: {
            'import/no-internal-modules': [
                'error',
                {
                    forbid: ['@proton/payments-ui', '@proton/payments-ui/**'],
                },
            ],
        },
    },
]);
