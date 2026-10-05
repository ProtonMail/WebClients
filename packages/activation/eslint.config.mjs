import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { componentsPackage, createBarrelIndexPaths } from '@proton/eslint-config-proton/barrel';
import { iconRestrictedImports } from '@proton/eslint-config-proton/icon';
import { createRestrictedImportRule } from '@proton/eslint-config-proton/restrictedImports';

// The bare `@proton/components` barrel is still imported here, so only its `/index` specifiers are banned for now.
const barrelPaths = createBarrelIndexPaths([componentsPackage]);

export default defineConfig([
    defaultConfig,
    {
        name: 'barrel-import-rules',
        rules: {
            'no-restricted-imports': createRestrictedImportRule({ paths: barrelPaths }),
            '@typescript-eslint/no-restricted-imports': ['error', { paths: iconRestrictedImports }],
        },
    },
    {
        name: 'barrel-import-rules-tsx',
        files: ['**/*.tsx', '**/*.jsx'],
        rules: {
            'no-restricted-imports': createRestrictedImportRule({ paths: barrelPaths, tsx: true }),
        },
    },
]);
