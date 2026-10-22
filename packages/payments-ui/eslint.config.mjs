import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import {
    createExtraneousDependenciesRule,
    extraneousDependenciesDevDependencies,
} from '@proton/eslint-config-proton/extraneousDependencies';

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
    {
        // `testing/` holds wrappers consumed only by test files, so it may reach for devDependencies.
        files: ['testing/**'],
        rules: {
            'import/no-extraneous-dependencies': createExtraneousDependenciesRule({
                devDependencies: [...extraneousDependenciesDevDependencies, '**/testing/**'],
            }),
        },
    },
]);
