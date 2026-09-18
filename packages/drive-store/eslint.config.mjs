import { defineConfig, globalIgnores } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { restrictedImports } from '@proton/eslint-config-proton/restrictedImports';

export default defineConfig([
    defaultConfig,
    {
        rules: {
            // drive-store is the legacy Drive fork, so it is allowed past the global @proton/drive
            // fence and may import the internal module entry points directly. internal/ stays private.
            'no-restricted-imports': [
                'error',
                {
                    paths: restrictedImports.paths,
                    patterns: [
                        ...restrictedImports.patterns.filter(
                            (pattern) => !pattern.group.some((group) => group.startsWith('@proton/drive'))
                        ),
                        {
                            group: ['@proton/drive/internal', '@proton/drive/internal/*'],
                            message: '@proton/drive/internal is private to packages/drive.',
                        },
                    ],
                },
            ],
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
