import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { createRestrictedImportsConfig } from '@proton/eslint-config-proton/restrictedImports';

export default defineConfig([
    {
        files: ['src/**/*'],
        extends: [
            defaultConfig,
            createRestrictedImportsConfig({
                rollout: ['components-barrel'],
            }),
            {
                rules: {
                    'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
                    curly: ['error', 'multi-line'],
                    // TODO: Remove this rule once the compat issue is resolved
                    'compat/compat': 'off',
                },
            },
        ],
    },
]);
