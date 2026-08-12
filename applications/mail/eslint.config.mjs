import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { atomsPackage, componentsPackage, createBarrelConfig, iconsPackage } from '@proton/eslint-config-proton/barrel';
import { iconRestrictedImports } from '@proton/eslint-config-proton/icon';

export default defineConfig([
    defaultConfig,
    createBarrelConfig({ packages: [atomsPackage, iconsPackage, componentsPackage] }),
    {
        rules: {
            'no-console': 'off',
            'no-nested-ternary': 'off',
            '@typescript-eslint/no-misused-promises': 'off',
            'react-hooks/exhaustive-deps': 'error',
            'no-restricted-syntax': [
                'error',
                {
                    selector: "VariableDeclarator[id.type='ObjectPattern'][init.name=/^[A-Z_]+$/]",
                    message:
                        'Destructuring of enum-like constants is not allowed. Use CONSTANT.PROPERTY instead to maintain code readability.',
                },
            ],
            'no-restricted-imports': [
                'warn',
                {
                    paths: [
                        {
                            name: '@proton/mail/store/counts/conversationCountsSlice',
                            importNames: ['useConversationCounts'],
                            message:
                                'To get location count, use useMailboxCounter from proton-mail/hooks/mailboxCounter/useMailboxCounter instead.',
                        },
                        {
                            name: '@proton/mail/store/counts/messageCountsSlice',
                            importNames: ['useMessageCounts'],
                            message:
                                'To get location count, use useMailboxCounter from proton-mail/hooks/mailboxCounter/useMailboxCounter instead.',
                        },
                        {
                            name: '@proton/shared/lib/logger',
                            importNames: ['logger'],
                            message:
                                'Use mailLogger from proton-mail/mailLogger instead of the shared logger directly.',
                        },
                    ],
                },
            ],
            '@typescript-eslint/no-restricted-imports': ['error', { paths: iconRestrictedImports }],
            // TODO: Migrate same-package imports to relative paths and remove this rule
            'custom-rules/no-package-self-import': 'off',
        },
    },
    {
        /**
         * Test state factories must stay import-light. Importing `rootReducer` as a value pulls in every slice of the application.
         * On a single test the imported modules went from 181 to 2449, and the time went from 0.33s to 0.92s when root reducer is loaded.
         */
        files: ['src/app/store/**/*.testing.ts'],
        rules: {
            '@typescript-eslint/no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            group: ['**/rootReducer', '**/store/store', '**/hooks'],
                            allowTypeImports: true,
                            message:
                                'Test state factories may only import types from the store. Build the slice from its own factory or initial state instead.',
                        },
                    ],
                },
            ],
        },
    },
]);
