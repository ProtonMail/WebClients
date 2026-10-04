import { defineConfig } from 'eslint/config';

import config from '@proton/eslint-config-proton/all';
import { iconRestrictedImports } from '@proton/eslint-config-proton/icon';
import { createRestrictedImportRule } from '@proton/eslint-config-proton/restrictedImports';

import noDirectIframeAccess from './eslint-rules/no-direct-iframe-access.mjs';

export default defineConfig([
    config,
    {
        plugins: {
            'mail-renderer': {
                rules: {
                    'no-direct-iframe-access': noDirectIframeAccess,
                },
            },
        },
        rules: {
            'mail-renderer/no-direct-iframe-access': 'error',
            'no-restricted-imports': createRestrictedImportRule({ paths: iconRestrictedImports }),
        },
    },
    {
        // Flat config replaces a rule's options per file, so `.tsx` files need the extra restrictions re-added here.
        files: ['**/*.tsx', '**/*.jsx'],
        rules: {
            'no-restricted-imports': createRestrictedImportRule({ paths: iconRestrictedImports, tsx: true }),
        },
    },
    {
        files: ['**/helpers/getIframeDocument.ts', '**/helpers/getIframeDocument.test.ts'],
        rules: {
            'mail-renderer/no-direct-iframe-access': 'off',
        },
    },
]);
