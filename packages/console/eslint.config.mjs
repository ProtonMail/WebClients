import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { createRestrictedImportsConfig } from '@proton/eslint-config-proton/restrictedImports';

export default defineConfig([
    defaultConfig,
    createRestrictedImportsConfig({
        rollout: ['account-barrel', 'components-barrel'],
    }),
    {
        rules: {
            'import/no-internal-modules': ['error', { forbid: ['@proton/atoms', '@proton/components'] }],
        },
    },
]);
