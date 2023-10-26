const { excludeNodeModulesExcept, excludeFiles, createRegex } = require('./helpers/regex');
const { BABEL_EXCLUDE_FILES, BABEL_INCLUDE_NODE_MODULES } = require('./constants');

const UNSUPPORTED_JS_LOADER = [
    {
        loader: require.resolve('babel-loader'),
        options: {
            cacheDirectory: true,
            cacheCompression: true,
            compact: true,
            presets: [
                [
                    require.resolve('@babel/preset-env'),
                    {
                        targets: { browsers: ['ie 11'] },
                        useBuiltIns: 'entry',
                        corejs: { version: '3.27' },
                    },
                ],
                [require.resolve('@babel/preset-typescript')],
            ],
            plugins: [],
        },
    },
];

const getBabelLoader = ({ browserslist, isProduction = false, hasReactRefresh = true, isTtag = false } = {}) => {
    const babelReactRefresh = hasReactRefresh ? [require.resolve('react-refresh/babel')] : [];
    const babelPluginsDev = [...babelReactRefresh];
    const babelPluginsProd = [
        [require.resolve('babel-plugin-transform-react-remove-prop-types'), { removeImport: true }],
    ];

    return {
        loader: require.resolve('babel-loader'),
        options: {
            cacheDirectory: true,
            cacheCompression: isProduction,
            compact: isProduction,
            babelrc: false,
            configFile: false,
            presets: [
                [
                    require.resolve('@babel/preset-env'),
                    {
                        targets: browserslist,
                        useBuiltIns: 'entry',
                        corejs: { version: '3.27' },
                        exclude: ['transform-typeof-symbol'], // Exclude transforms that make all code slower
                    },
                ],
                [
                    require.resolve('@babel/preset-react'),
                    {
                        // Adds component stack to warning messages
                        // Adds __self attribute to JSX which React will use for some warnings
                        development: !isProduction,
                        runtime: 'automatic',
                    },
                ],
                [require.resolve('@babel/preset-typescript')],
            ],
            plugins: [
                require.resolve('@babel/plugin-syntax-dynamic-import'),
                require.resolve('@babel/plugin-proposal-object-rest-spread'),
                require.resolve('@babel/plugin-proposal-nullish-coalescing-operator'),
                require.resolve('@babel/plugin-proposal-optional-chaining'),
                require.resolve('@babel/plugin-proposal-class-properties'),
                require.resolve('@babel/plugin-proposal-private-methods'),
                require.resolve('@babel/plugin-transform-runtime'),
                ...(isTtag ? [[require.resolve('ttag'), { extract: { output: 'i18n/template.pot' } }]] : []),
                ...(isProduction ? babelPluginsProd : babelPluginsDev),
            ],
        },
    };
};

const getJsLoader = (options) => {
    return {
        test: /\.js$|\.tsx?$|\.mjs$/,
        exclude: createRegex(
            excludeNodeModulesExcept(BABEL_INCLUDE_NODE_MODULES),
            excludeFiles([...BABEL_EXCLUDE_FILES, 'pre.ts', 'unsupported.ts'])
        ),
        use: getBabelLoader(options),
    };
};

const getJsLoaders = (options) => {
    return [
        {
            test: /(unsupported|pre)\.ts$/,
            use: UNSUPPORTED_JS_LOADER,
        },
        getJsLoader(options),
    ];
};

module.exports = { getJsLoader, getJsLoaders };
