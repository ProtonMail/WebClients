import { defineConfig } from 'eslint/config';

import defaultConfig from '@proton/eslint-config-proton/all';
import { atomsPackage, componentsPackage, createBarrelPaths, iconsPackage } from '@proton/eslint-config-proton/barrel';
import { iconRestrictedImports } from '@proton/eslint-config-proton/icon';
import { createRestrictedImportRule } from '@proton/eslint-config-proton/restrictedImports';

const barrelPackages = [atomsPackage, iconsPackage, componentsPackage];

/**
 * Every `no-restricted-imports` restriction for the app goes in here. Flat config replaces a rule's options wholesale
 * for each file it matches, so another config object setting the rule would silently drop these and the shared ones.
 */
const restrictedImportOptions = {
    paths: [
        // `@proton/components/index` resolves to the same barrel as `@proton/components`, so ban both specifiers.
        ...createBarrelPaths(barrelPackages),
        ...createBarrelPaths(barrelPackages.map((name) => `${name}/index`)),
        ...iconRestrictedImports,
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
    ],
};

const noEnumDestructuring = {
    selector: "VariableDeclarator[id.type='ObjectPattern'][init.name=/^[A-Z_]+$/]",
    message:
        'Destructuring of enum-like constants is not allowed. Use CONSTANT.PROPERTY instead to maintain code readability.',
};

export default defineConfig([
    defaultConfig,
    {
        rules: {
            'no-console': 'off',
            'no-nested-ternary': 'off',
            '@typescript-eslint/no-misused-promises': 'off',
            'react-hooks/exhaustive-deps': 'error',
            'no-restricted-syntax': ['error', noEnumDestructuring],
            'no-restricted-imports': createRestrictedImportRule(restrictedImportOptions),
        },
    },
    {
        files: ['**/*.tsx', '**/*.jsx'],
        rules: {
            'no-restricted-imports': createRestrictedImportRule({ ...restrictedImportOptions, tsx: true }),
        },
    },
    {
        files: ['src/app/lumo/**/*.{ts,tsx}'],
        ignores: ['src/app/lumo/helpers/references.ts', 'src/app/lumo/**/*.test.{ts,tsx}'],
        rules: {
            'no-restricted-syntax': [
                'error',
                noEnumDestructuring,
                {
                    selector: "CallExpression[callee.property.name='referenceFor'][arguments.0.value='email']",
                    message:
                        'Mint email references with emailReferenceFor, messageReferenceFor or conversationReferenceFor, so a conversation id is fetched from the right endpoint once it leaves every store.',
                },
            ],
        },
    },
    {
        /**
         * Test state factories must stay import-light. Importing `rootReducer` as a value pulls in every slice of the application.
         * On a single test the imported modules went from 181 to 2449, and the time went from 0.33s to 0.92s when root reducer is loaded.
         */
        files: ['src/app/store/tests/**/*.ts'],
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
