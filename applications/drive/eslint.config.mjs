import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { restrictedImports } from '@proton/eslint-config-proton/restrictedImports';

const isFixMode = process.argv.includes('--fix');

export default defineConfig([
    defaultConfig,
    {
        rules: {
            // applications/drive owns the drive code, so it overrides the global @proton/drive fence:
            // it may import any folder EXCEPT public/ (the surface for other apps) and internal/ (package-private).
            'no-restricted-imports': [
                'error',
                {
                    paths: restrictedImports.paths,
                    patterns: [
                        // Reuse the shared patterns, minus the default @proton/drive fence: the Drive app owns
                        // the code and may reach into any folder except public/ (for other apps) and internal/.
                        ...restrictedImports.patterns.filter(
                            (pattern) => !pattern.group.some((group) => group.startsWith('@proton/drive'))
                        ),
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
                },
            ],
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
            // TODO: Remove this rule once the cycle dependency is fixed
            'import/no-cycle': 'off',
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
