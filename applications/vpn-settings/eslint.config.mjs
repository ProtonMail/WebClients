import { defineConfig } from 'eslint/config';

import config from '@proton/eslint-config-proton/all';
import {
    accountPackage,
    atomsPackage,
    componentsPackage,
    createBarrelPaths,
    hooksPackage,
    iconsPackage,
} from '@proton/eslint-config-proton/barrel';
import { createRestrictedImportRule } from '@proton/eslint-config-proton/restrictedImports';

const barrelPaths = createBarrelPaths([accountPackage, atomsPackage, componentsPackage, hooksPackage, iconsPackage]);

export default defineConfig([
    config,
    {
        name: 'barrel-import-rules',
        rules: {
            'no-restricted-imports': createRestrictedImportRule({ paths: barrelPaths }),
        },
    },
    {
        name: 'barrel-import-rules-tsx',
        files: ['**/*.tsx'],
        rules: {
            'no-restricted-imports': createRestrictedImportRule({ paths: barrelPaths, tsx: true }),
        },
    },
]);
