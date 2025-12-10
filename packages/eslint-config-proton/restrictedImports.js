export const restrictedImports = {
    paths: [
        {
            name: 'reselect',
            importNames: ['createSelector'],
            message: 'Please use createSelector from @redux/toolkit instead.',
        },
    ],

    patterns: [
        {
            group: ['pmcrypto'],
            message:
                'You should probably import from `@proton/crypto` instead: using `pmcrypto` directly is only needed for crypto-specific use cases.',
        },
        {
            group: ['packages/'],
            message: 'You should import from `@proton/` instead.',
        },
        {
            group: ['@proton/payments/index'],
            message: 'You should import from `@proton/payments` instead.',
        },
        {
            group: ['@proton/payments/core/*'],
            message: 'You should import from `@proton/payments` instead.',
        },
        {
            group: ['@proton/payments/ui/*'],
            message: 'You should import from `@proton/payments/ui` instead.',
        },
        {
            group: ['@proton/unleash/index'],
            message: 'You should import from `@proton/unleash` instead.',
        },
        {
            group: ['@proton/mail/index'],
            message: 'You should import from `@proton/mail` instead.',
        },
    ],
};
