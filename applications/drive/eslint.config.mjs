import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { createRestrictedImportsConfig } from '@proton/eslint-config-proton/restrictedImports';

const isFixMode = process.argv.includes('--fix');

export default defineConfig([
    defaultConfig,
    // The shared @proton/drive fence is skipped for this app: it owns the drive code, so it may import any folder
    // EXCEPT public/ (the surface for other apps) and internal/ (package-private).
    createRestrictedImportsConfig({
        patterns: [
            {
                group: ['@proton/drive/public', '@proton/drive/public/*'],
                message:
                    'applications/drive owns the code - import the internal entry points (@proton/drive/modules/*, components/*, ...) directly, not the public wrappers.',
            },
            {
                group: ['@proton/drive/internal', '@proton/drive/internal/*'],
                message: '@proton/drive/internal is private to packages/drive.',
            },
        ],
    }),
    {
        rules: {
            'react/prop-types': 'off',
            ...(!isFixMode && {
                'react-hooks/exhaustive-deps': 'warn',
            }),
            '@typescript-eslint/no-non-null-assertion': 'warn',
            '@typescript-eslint/no-use-before-define': [
                'error',
                {
                    functions: false,
                    classes: false,
                },
            ],
            'no-console': [
                'warn',
                {
                    allow: ['warn', 'error'],
                },
            ],
            'max-classes-per-file': 'off',
            // TODO: Remove this rule once the compat issue is resolved
            'compat/compat': 'off',
        },
    },
    {
        files: ['**/*.test.ts'],
        rules: {
            'max-classes-per-file': 'off',
            'class-methods-use-this': 'off',
        },
    },
]);
