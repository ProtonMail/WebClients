import { defineConfig } from 'eslint/config';

import config from '@proton/eslint-config-proton/all';

export default defineConfig([
    config,
    {
        ignores: ['testing/vitest/**'],
    },
    {
        files: ['testing/**'],
        rules: {
            'custom-rules/no-package-self-import': 'off',
            'import/no-internal-modules': 'off',
            'import/no-extraneous-dependencies': 'off',
        },
    },
]);
