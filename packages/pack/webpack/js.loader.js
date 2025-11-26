const { excludeNodeModulesExcept, excludeFiles, createRegex } = require('./helpers/regex');
const { BABEL_EXCLUDE_FILES, BABEL_INCLUDE_NODE_MODULES } = require('./constants');
const path = require('path');

const coreJsVersion = require('core-js/package.json').version;

const UNSUPPORTED_JS_LOADER = [
    {
        loader: require.resolve('babel-loader'),
        options: {
            cacheDirectory: true,
            cacheCompression: true,
            compact: true,
            presets: [
                [
                    require('@babel/preset-env').default,
                    {
                        targets: { browsers: ['ie 11'] },
                        useBuiltIns: 'entry',
                        corejs: { version: coreJsVersion },
                    },
                ],
                [require('@babel/preset-typescript').default],
            ],
            plugins: [],
        },
    },
];

const getBabelLoader = ({ browserslist, isProduction = false, hasReactRefresh = true } = {}) => {
    const babelReactRefresh = hasReactRefresh ? [require.resolve('react-refresh/babel')] : [];
    const babelPluginsDev = [...babelReactRefresh];
    const babelPluginsProd = [
        [require('babel-plugin-transform-react-remove-prop-types').default, { removeImport: true }],
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
                    require('@babel/preset-env').default,
                    {
                        targets: browserslist,
                        useBuiltIns: 'entry',
                        shippedProposals: true /* needed for typed-array base64 and hex functions. NOTE: Only works for useBuiltIns: 'usage' */,
                        corejs: { version: coreJsVersion },
                        exclude: ['transform-typeof-symbol'], // Exclude transforms that make all code slower
                    },
                ],
                [
                    require('@babel/preset-react').default,
                    {
                        // Adds component stack to warning messages
                        // Adds __self attribute to JSX which React will use for some warnings
                        development: !isProduction,
                        runtime: 'automatic',
                    },
                ],
                [require('@babel/preset-typescript').default],
            ],
            plugins: [
                require('@babel/plugin-transform-class-properties').default,
                [
                    require('@babel/plugin-transform-runtime').default,
                    {
                        corejs: false,
                        version: require('@babel/runtime/package.json').version,
                        regenerator: true,
                        useESModules: true,
                        absoluteRuntime: path.dirname(require.resolve('@babel/runtime/package.json')),
                    },
                ],
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
