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
import { iconRestrictedImports } from '@proton/eslint-config-proton/icon';
import { createRestrictedImportRule } from '@proton/eslint-config-proton/restrictedImports';

const barrelPackages = [accountPackage, atomsPackage, componentsPackage, hooksPackage, iconsPackage];

// Both `@proton/components` and `@proton/components/index` resolve to the barrel, so restrict both specifiers.
const barrelPaths = [
    ...createBarrelPaths(barrelPackages),
    ...createBarrelPaths(barrelPackages.map((name) => `${name}/index`)),
];

export default defineConfig([
    config,
    {
        name: 'barrel-import-rules',
        rules: {
            'no-restricted-imports': createRestrictedImportRule({ paths: barrelPaths }),
            '@typescript-eslint/no-restricted-imports': ['error', { paths: iconRestrictedImports }],
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
