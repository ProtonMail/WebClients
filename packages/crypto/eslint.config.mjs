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
        'no-restricted-imports': 'off', // currently only relevant to guard against `pmcrypto` imports
        'no-restricted-properties': 'off', // currently only relevant to guard against direct `crypto.subtle` access
        'jasmine/no-focused-tests': 'error',
        // TODO: Add the missing explicit deps and remove this rule
        'import/no-extraneous-dependencies': 'off',
    },
});
