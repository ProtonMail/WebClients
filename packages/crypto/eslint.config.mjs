import chaifriendly from 'eslint-plugin-chai-friendly';
import jasminePlugin from 'eslint-plugin-jasmine';
import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/base';

export default defineConfig(defaultConfig, {
    plugins: { jasmine: jasminePlugin, 'chai-friendly': chaifriendly },
    rules: {
        'no-unused-expressions': 'off',
        '@typescript-eslint/no-unused-expressions': 'off',
        'chai-friendly/no-unused-expressions': ['error', { allowShortCircuit: true }],
        'no-restricted-imports': 'off', // currently only used to guard against `pmcrypto` imports
        'jasmine/no-focused-tests': 'error',
    },
});
