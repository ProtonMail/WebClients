import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/base';

export default defineConfig(defaultConfig, {
    rules: {
        'no-unused-expressions': 'off',
        '@typescript-eslint/no-unused-expressions': 'off',
        'no-restricted-imports': 'off', // currently only relevant to guard against `pmcrypto` imports
        'no-restricted-properties': 'off', // currently only relevant to guard against direct `crypto.subtle` access
        // TODO: Add the missing explicit deps and remove this rule
        'import/no-extraneous-dependencies': 'off',
    },
});
