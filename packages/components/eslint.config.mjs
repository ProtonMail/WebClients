import { defineConfig, globalIgnores } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { createBarrelConfig, iconsPackage } from '@proton/eslint-config-proton/barrel';

export default defineConfig([
    defaultConfig,
    createBarrelConfig({ packages: [iconsPackage] }),
    {
        rules: {
            'react/button-has-type': ['warn'],
            'react/forbid-prop-types': ['warn'],
            'react/no-array-index-key': ['warn'],
            'import/no-internal-modules': ['error', { forbid: ['./index', './index'] }],
            // TODO: Add the missing explicit deps and remove this rule
            'import/no-extraneous-dependencies': 'off',
            // TODO: Remove this rule once the cycles are fixed
            'import-x/no-cycle': 'off',
        },
    },
    globalIgnores(['**/iwad/**']),
]);
