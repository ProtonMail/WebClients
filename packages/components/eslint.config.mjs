import { defineConfig, globalIgnores } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';

export default defineConfig([
    defaultConfig,
    {
        rules: {
            'react/button-has-type': ['warn'],
            'react/forbid-prop-types': ['warn'],
            'react/no-array-index-key': ['warn'],
            'import/no-internal-modules': [
                'error',
                {
                    forbid: ['@proton/components', '@proton/components'],
                },
            ],
            'import/no-cycle': ['error', { maxDepth: 1, ignoreExternal: true, disableScc: true }],
        },
    },
    globalIgnores(['**/iwad/**']),
]);
