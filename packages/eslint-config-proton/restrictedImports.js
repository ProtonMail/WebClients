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
            group: ['packages/'],
            message: 'You should import from `@proton/` instead.',
        },
        {
            group: ['@proton/unleash/index'],
            message: 'You should import from `@proton/unleash` instead.',
        },
        {
            group: ['@proton/mail/index'],
            message: 'You should import from `@proton/mail` instead.',
        },
        {
            group: ['@proton/drive/*', '!@proton/drive/index', '!@proton/drive/public', '!@proton/drive/public/**'],
            message: 'Only `@proton/drive` (index) and `@proton/drive/public/*` are public and importable.',
        },
    ],
};
