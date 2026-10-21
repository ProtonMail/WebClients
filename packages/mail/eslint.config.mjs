import { defineConfig } from 'eslint/config';

import config from '@proton/eslint-config-proton/all';
import { extraneousDependenciesDevDependencies } from '@proton/eslint-config-proton/extraneousDependencies';
import { createRestrictedImportsConfig } from '@proton/eslint-config-proton/restrictedImports';

export default defineConfig([
    config,
    createRestrictedImportsConfig({ rollout: ['account-barrel'] }),
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
