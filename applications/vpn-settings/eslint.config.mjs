import { defineConfig } from 'eslint/config';

import config from '@proton/eslint-config-proton/all';
import { createRestrictedImportsConfig } from '@proton/eslint-config-proton/restrictedImports';

export default defineConfig([
    config,
    createRestrictedImportsConfig({
        rollout: ['account-barrel', 'components-barrel'],
    }),
]);
