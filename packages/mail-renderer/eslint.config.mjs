import { defineConfig } from 'eslint/config';

import config from '@proton/eslint-config-proton/all';
import { createRestrictedImportsConfig } from '@proton/eslint-config-proton/restrictedImports';

import noDirectIframeAccess from './eslint-rules/no-direct-iframe-access.mjs';

export default defineConfig([
    config,
    createRestrictedImportsConfig({ rollout: ['icon-component'] }),
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
        },
    },
    {
        files: ['**/helpers/getIframeDocument.ts', '**/helpers/getIframeDocument.test.ts'],
        rules: {
            'mail-renderer/no-direct-iframe-access': 'off',
        },
    },
]);
