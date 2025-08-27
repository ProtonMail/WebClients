import jasminePlugin from 'eslint-plugin-jasmine';
import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';

export default defineConfig(defaultConfig, {
    plugins: { jasmine: jasminePlugin },
    rules: {
        'jasmine/no-focused-tests': 'error',
    },
});
