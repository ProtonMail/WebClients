const { excludeNodeModulesExcept, excludeFiles, createRegex } = require('./helpers/regex');
const { BABEL_EXCLUDE_FILES, BABEL_INCLUDE_NODE_MODULES } = require('./constants');

const getUnsupportedLoader = () => {
    return {
        loader: require.resolve('swc-loader'),
        options: {
            env: { coreJs: require('core-js/package.json').version, mode: 'entry', targets: 'ie 11' },
        },
    };
};

const getSwcLoader = ({ browserslist, isProduction = false, hasReactRefresh = true } = {}) => {
    return {
        loader: require.resolve('swc-loader'),
        options: {
            env: { coreJs: require('core-js/package.json').version, mode: 'entry', targets: browserslist },
            jsc: {
                parser: {
                    syntax: 'typescript',
                    tsx: true,
                    dynamicImport: true,
                },
                transform: {
                    react: {
                        runtime: 'automatic',
                        refresh: !isProduction && hasReactRefresh,
                    },
                },
            },
        },
    };
};

const getJsLoader = (options) => {
    return {
        test: /\.js$|\.tsx?$/,
        exclude: createRegex(
            excludeNodeModulesExcept(BABEL_INCLUDE_NODE_MODULES),
            excludeFiles([...BABEL_EXCLUDE_FILES, 'pre.ts', 'unsupported.ts'])
        ),
        use: getSwcLoader(options),
    };
};

const getJsLoaders = (options) => {
    return [
        {
            test: /(unsupported|pre)\.ts$/,
            use: getUnsupportedLoader(options),
        },
        getJsLoader(options),
    ];
};

module.exports = { getJsLoader, getJsLoaders };
