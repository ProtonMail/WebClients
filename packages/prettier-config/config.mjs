export default {
    printWidth: 120,
    arrowParens: 'always',
    singleQuote: true,
    // Default in prettier 3 is 'all', but since that'd require a large migration keeping it es5 for now
    trailingComma: 'es5',
    tabWidth: 4,
    proseWrap: 'never',
    overrides: [
        {
            files: '*.scss',
            options: {
                tabWidth: 2,
                useTabs: true,
                singleQuote: true,
            },
        },
        {
            files: '*.ts',
            options: {
                importOrderParserPlugins: ['typescript'],
            },
        },
        {
            files: '*.svg',
            options: {
                parser: 'html',
            },
        },
    ],
    importOrder: [
        '^react(.*)$',
        '^react-dom(.*)$',
        '^react-router-dom(.*)$',
        '<THIRD_PARTY_MODULES>',
        '^codemirror(?!.*\\.(?:css|scss)$).*$',
        '^@proton/(?!.*\\.(?:css|scss)$).*$',
        '^proton-mail(?!.*\\.(?:css|scss)$).*$',
        '^[./].*(?<!\\.(css|scss))$',
        '^@proton/.*\\.(css|scss)$',
        '^proton-mail/.*\\.(css|scss)$',
        '^codemirror/.*\\.(css|scss)$',
        '^[./].*\\.(css|scss)$',
    ],
    importOrderSeparation: true,
    importOrderSortSpecifiers: true,
    plugins: ['@trivago/prettier-plugin-sort-imports'],
};
