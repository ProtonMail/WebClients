import { defineConfig } from 'eslint/config';

import config from '@proton/eslint-config-proton/all';
import { extraneousDependenciesDevDependencies } from '@proton/eslint-config-proton/extraneousDependencies';

export default defineConfig([
    config,
    {
        // Mocks @proton/components modules without a manifest dep (cycle constraint).
        files: ['testing/setup/**'],
        rules: {
            'import/no-extraneous-dependencies': 'off',
            'import/no-internal-modules': 'off',
        },
    },
    {
        files: ['testing/**'],
        ignores: ['testing/setup/**'],
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
