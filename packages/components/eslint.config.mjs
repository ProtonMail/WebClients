import { defineConfig, globalIgnores } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import barrelConfig from '@proton/eslint-config-proton/barrel';

export default defineConfig([
    defaultConfig,
    barrelConfig,
    {
        rules: {
            'react/button-has-type': ['warn'],
            'react/forbid-prop-types': ['warn'],
            'react/no-array-index-key': ['warn'],
            'import/no-internal-modules': ['error', { forbid: ['@proton/components', '@proton/components'] }],
            'import/no-cycle': ['error', { maxDepth: 1, ignoreExternal: true, disableScc: true }],
            // TODO: Add the missing explicit deps and remove this rule
            'import/no-extraneous-dependencies': 'off',
        },
    },
    globalIgnores(['**/iwad/**']),
]);
