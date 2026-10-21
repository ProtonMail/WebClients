import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { createRestrictedImportsConfig } from '@proton/eslint-config-proton/restrictedImports';

const noParentRelativeImports = {
    group: ['../*', './../*'],
    message: 'Use the proton-pass-web/* alias instead of walking up directories.',
};

export default defineConfig([
    defaultConfig,
    createRestrictedImportsConfig({
        rollout: ['components-barrel'],
        patterns: [noParentRelativeImports],
    }),
    {
        rules: {
            'no-console': ['error', { allow: ['warn', 'error'] }],
            curly: ['error', 'multi-line'],
            // TODO: Remove this rule once the compat issue is resolved
            'compat/compat': 'off',
        },
    },
]);
