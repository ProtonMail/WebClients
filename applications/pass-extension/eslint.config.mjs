import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { createBarrelPaths } from '@proton/eslint-config-proton/barrel';
import { createRestrictedImportRule } from '@proton/eslint-config-proton/restrictedImports';

const noParentRelativeImports = {
    group: ['../*', './../*'],
    message: 'Use the proton-pass-extension/* alias instead of walking up directories.',
};

const restrictedImportOptions = { paths: createBarrelPaths(), patterns: [noParentRelativeImports] };

export default defineConfig([
    {
        files: ['src/**/*'],
        extends: [
            defaultConfig,
            {
                rules: {
                    'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
                    curly: ['error', 'multi-line'],
                    // TODO: Add the missing explicit deps and remove this rule
                    'import/no-extraneous-dependencies': 'off',
                    // TODO: Remove this rule once the compat issue is resolved
                    'compat/compat': 'off',
                    'no-restricted-imports': createRestrictedImportRule(restrictedImportOptions),
                    // TODO: Migrate same-package imports to relative paths and remove this rule
                    'custom-rules/no-package-self-import': 'off',
                },
            },
            {
                files: ['**/*.tsx', '**/*.jsx'],
                rules: {
                    'no-restricted-imports': createRestrictedImportRule({ ...restrictedImportOptions, tsx: true }),
                },
            },
        ],
    },
]);
