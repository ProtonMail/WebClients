import { defineConfig, globalIgnores } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { createBarrelPaths } from '@proton/eslint-config-proton/barrel';
import { iconRestrictedImports } from '@proton/eslint-config-proton/icon';
import { createRestrictedImportRule } from '@proton/eslint-config-proton/restrictedImports';

export default defineConfig([
    defaultConfig,
    {
        rules: {
            'no-console': ['error', { allow: ['warn', 'error'] }],
            curly: ['error', 'multi-line'],
            'no-restricted-imports': createRestrictedImportRule({
                paths: [...createBarrelPaths(), ...iconRestrictedImports],
            }),
        },
    },
    globalIgnores(['asm/', 'docs/starlight/']),
]);
