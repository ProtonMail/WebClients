import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { createBarrelPaths } from '@proton/eslint-config-proton/barrel';
import { createRestrictedImportRule } from '@proton/eslint-config-proton/restrictedImports';

const restrictedImportOptions = { paths: createBarrelPaths() };

export default defineConfig([
    {
        files: ['src/**/*'],
        extends: [
            defaultConfig,
            {
                rules: {
                    'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
                    curly: ['error', 'multi-line'],
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
        ],
    },
]);
