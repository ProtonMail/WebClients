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
                            importNames: ['logger', 'loggerManager'],
                            message:
                                'Use mailLogger from proton-mail/mailLogger instead of the shared logger directly.',
                        },
                    ],
                },
            ],
            '@typescript-eslint/no-restricted-imports': ['error', { paths: iconRestrictedImports }],
            // TODO: Remove this rule once the cycle dependency is fixed
            'import/no-cycle': 'off',
        },
    },
]);
