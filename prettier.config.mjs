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
        '^@proton/(.*)$',
        '^proton-mail(.*)$',
        '^[./].*(?<!\\.(c|sc)ss)$',
        '(c|sc)ss$',
    ],
    importOrderSeparation: true,
    importOrderSortSpecifiers: true,
    plugins: ['@trivago/prettier-plugin-sort-imports'],
};
