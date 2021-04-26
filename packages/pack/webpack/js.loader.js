const { excludeNodeModulesExcept, excludeFiles, createRegex } = require('./helpers/regex');
const { BABEL_EXCLUDE_FILES, BABEL_INCLUDE_NODE_MODULES } = require('./constants');

const UNSUPPORTED_JS_LOADER = [
    {
        loader: 'babel-loader',
        options: {
            cacheDirectory: true,
            cacheCompression: true,
            compact: true,
            presets: [
                [
                    '@babel/preset-env',
                    {
                        targets: { browsers: ['ie 11'] },
                        useBuiltIns: 'entry',
                        corejs: 3
                    }
                ]
            ],
            plugins: []
        }
    }
];

const getBabelLoader = ({ isProduction = false, hasReactRefresh = true, isTtag = false } = {}) => {
    const babelReactRefresh = hasReactRefresh ? [require.resolve('react-refresh/babel')] : [];
    const babelPluginsDev = [...babelReactRefresh];
    const babelPluginsProd = [['babel-plugin-transform-react-remove-prop-types', { removeImport: true }]];

    return {
        loader: 'babel-loader',
        options: {
            cacheDirectory: true,
            cacheCompression: isProduction,
            compact: isProduction,
            presets: [
                ['@babel/preset-typescript'],
                [
                    '@babel/preset-env',
                    {
                        targets: {
                            browsers: isProduction
                                ? ['> 0.5%, not IE 11, Firefox ESR, Safari 11']
                                : ['last 1 chrome version', 'last 1 firefox version', 'last 1 safari version']
                        },
                        useBuiltIns: 'entry',
                        corejs: 3,
                        exclude: ['transform-typeof-symbol'] // Exclude transforms that make all code slower
                    }
                ],
                [
                    '@babel/preset-react',
                    {
                        // Adds component stack to warning messages
                        // Adds __self attribute to JSX which React will use for some warnings
                        development: !isProduction
                    }
                ]
            ],
            plugins: [
                '@babel/plugin-syntax-dynamic-import',
                '@babel/plugin-proposal-object-rest-spread',
                '@babel/plugin-proposal-nullish-coalescing-operator',
                '@babel/plugin-proposal-optional-chaining',
                ['@babel/plugin-proposal-class-properties', { loose: true }],
                require.resolve('babel-plugin-lodash'),
                '@babel/plugin-transform-runtime',
                ...(isTtag ? [['ttag', { extract: { output: 'i18n/template.pot' } }]] : []),
                ...(isProduction ? babelPluginsProd : babelPluginsDev)
            ]
        }
    };
};

const getJsLoader = (options) => {
    return {
        test: /\.js$|\.tsx?$/,
        exclude: createRegex(
            excludeNodeModulesExcept(BABEL_INCLUDE_NODE_MODULES),
            excludeFiles([...BABEL_EXCLUDE_FILES, 'unsupported.js'])
        ),
        use: getBabelLoader(options)
    };
};

const getJsLoaders = (options) => {
    return [
        {
            test: /\.(ts|tsx|js|jsx)?$/,
            use: ['source-map-loader'],
            exclude: /web-streams-polyfill/,
            enforce: 'pre'
        },
        {
            test: /unsupported\.(js|tsx?)$/,
            use: UNSUPPORTED_JS_LOADER
        },
        getJsLoader(options)
    ];
};

module.exports = { getJsLoader, getJsLoaders };
