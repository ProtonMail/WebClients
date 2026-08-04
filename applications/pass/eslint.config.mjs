import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { createBarrelPaths } from '@proton/eslint-config-proton/barrel';
import { createRestrictedImportRule } from '@proton/eslint-config-proton/restrictedImports';

const noParentRelativeImports = {
    group: ['../*', './../*'],
    message: 'Use the proton-pass-web/* alias instead of walking up directories.',
};

const restrictedImportOptions = { paths: createBarrelPaths(), patterns: [noParentRelativeImports] };

export default defineConfig([
    defaultConfig,
    {
        rules: {
            'no-console': ['error', { allow: ['warn', 'error'] }],
            curly: ['error', 'multi-line'],
            // TODO: Add the missing explicit deps and remove this rule
            'import/no-extraneous-dependencies': 'off',
            // TODO: Remove this rule once the compat issue is resolved
            'compat/compat': 'off',
            'no-restricted-imports': createRestrictedImportRule(restrictedImportOptions),
        },
    },
    {
        files: ['**/*.tsx', '**/*.jsx'],
        rules: {
            'no-restricted-imports': createRestrictedImportRule({ ...restrictedImportOptions, tsx: true }),
        },
    },
]);
