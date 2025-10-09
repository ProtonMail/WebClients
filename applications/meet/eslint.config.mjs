import { defineConfig, globalIgnores } from 'eslint/config';

import config from '@proton/eslint-config-proton/all';

export default defineConfig(config, globalIgnores(['src/background-blur-assets/**/*']), {
    rules: {
        // TODO: Add the missing explicit deps and remove this rule
        'import/no-extraneous-dependencies': 'off',
    },
});
