const path = require('path');

const { excludeNodeModulesExcept, excludeFiles, createRegex } = require('./helpers/regex');
const { BABEL_EXCLUDE_FILES, BABEL_INCLUDE_NODE_MODULES } = require('./constants');

/** SWC injects core-js imports into the files it transpiles, which may belong to packages that don't
 * declare core-js. Resolve them to the copy whose version `env.coreJs` targets. */
const coreJsResolve = { alias: { 'core-js': path.dirname(require.resolve('core-js/package.json')) } };

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
            /** @type {import('@swc/core').EnvConfig} */
            env: {
                coreJs: require('core-js/package.json').version,
                mode: 'entry',
                targets: browserslist,
                shippedProposals: true /* needed for typed-array base64 and hex functions */,
            },
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
        resolve: coreJsResolve,
    };
};

const getJsLoaders = (options) => {
    return [
        {
            test: /(unsupported|pre)\.ts$/,
            use: getUnsupportedLoader(options),
            resolve: coreJsResolve,
        },
        getJsLoader(options),
    ];
};

module.exports = { getJsLoader, getJsLoaders };
