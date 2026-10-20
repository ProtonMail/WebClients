import { defineConfig, globalIgnores } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { createRestrictedImportsConfig } from '@proton/eslint-config-proton/restrictedImports';

export default defineConfig([
    defaultConfig,
    // drive-store is the legacy Drive fork, so the shared @proton/drive fence is skipped for it and it may import the
    // internal module entry points directly. internal/ stays private.
    createRestrictedImportsConfig({
        patterns: [
            {
                group: ['@proton/drive/internal', '@proton/drive/internal/*'],
                message: '@proton/drive/internal is private to packages/drive.',
            },
        ],
    }),
    {
        rules: {
            '@typescript-eslint/no-use-before-define': [
                'error',
                {
                    functions: false,
                    classes: false,
                },
            ],
            // TODO: Remove this rule once the compat issue is resolved
            'compat/compat': 'off',
        },
    },
    globalIgnores(['scripts']),
]);
