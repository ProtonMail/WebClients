import jasminePlugin from 'eslint-plugin-jasmine';
import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';

export default defineConfig(defaultConfig, {
    plugins: { jasmine: jasminePlugin },
    rules: {
        'jasmine/no-focused-tests': 'error',
        // TODO: Add the missing explicit deps and remove this rule
        'import/no-extraneous-dependencies': 'off',
    },
});
