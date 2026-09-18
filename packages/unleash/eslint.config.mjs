import { defineConfig } from 'eslint/config';

import config from '@proton/eslint-config-proton/all';
import { extraneousDependenciesDevDependencies } from '@proton/eslint-config-proton/extraneousDependencies';

export default defineConfig([
    config,
    {
        ignores: ['testing/vitest/**'],
    },
    {
        files: ['testing/**'],
        rules: {
            'import/no-extraneous-dependencies': [
                'error',
                {
                    devDependencies: [...extraneousDependenciesDevDependencies, '**/testing/**'],
                    optionalDependencies: false,
                },
            ],
            'import/no-internal-modules': 'off',
        },
    },
]);
