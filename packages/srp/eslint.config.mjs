import { defineConfig, globalIgnores } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/base';

export default defineConfig(defaultConfig, globalIgnores(['test/**/*data.js']), {
    rules: {
        // TODO: Add the missing explicit deps and remove this rule
        'import/no-extraneous-dependencies': 'off',
    },
});
