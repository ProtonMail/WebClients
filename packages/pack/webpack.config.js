const path = require('path');

const { getSource } = require('./webpack/helpers/source');
const jsLoader = require('./webpack/js.loader');
const cssLoader = require('./webpack/css.loader');
const assetsLoader = require('./webpack/assets.loader');
const plugins = require('./webpack/plugins');
const optimization = require('./webpack/optimization');
const { outputPath } = require('./webpack/paths');

const { excludeNodeModulesExcept, excludeFiles, createRegex } = require('./webpack/helpers/regex');
const { BABEL_EXCLUDE_FILES, BABEL_INCLUDE_NODE_MODULES } = require('./webpack/constants');

function main({ port, publicPath }) {
    const conf = {
        isProduction: process.env.NODE_ENV === 'production',
        publicPath: publicPath || '/'
    };

    const { isProduction } = conf;

    return {
        stats: 'minimal',
        mode: !isProduction ? 'development' : 'production',
        bail: isProduction,
        devtool: false,
        watchOptions: {
            ignored: [
                createRegex(excludeNodeModulesExcept(BABEL_INCLUDE_NODE_MODULES), excludeFiles(BABEL_EXCLUDE_FILES)),
                'i18n/*.json',
                /\*\.(gif|jpeg|jpg|ico|png)/
            ]
        },
        devServer: {
            hot: true,
            inline: true,
            compress: true,
            host: '0.0.0.0',
            public: 'localhost',
            historyApiFallback: {
                index: publicPath
            },
            disableHostCheck: true,
            contentBase: outputPath,
            publicPath,
            stats: 'minimal'
        },
        resolve: {
            symlinks: false,
            alias: {
                // Ensure that the correct package is used when symlinking
                pmcrypto: path.resolve('./node_modules/pmcrypto'),
                react: path.resolve('./node_modules/react'),
                'react-dom': path.resolve('./node_modules/react-dom'),
                'design-system': path.resolve('./node_modules/design-system'),
                'proton-shared': path.resolve('./node_modules/proton-shared'),
                'react-components': path.resolve('./node_modules/react-components')
            }
        },
        entry: {
            index: [
                `webpack-dev-server/client?http://localhost:${port}/`,
                'webpack/hot/dev-server',
                getSource('./src/app/index.js')
            ]
        },
        output: {
            path: outputPath,
            filename: isProduction ? '[name].[chunkhash:8].js' : '[name].js',
            publicPath,
            chunkFilename: isProduction ? '[name].[chunkhash:8].chunk.js' : '[name].chunk.js',
            crossOriginLoading: 'anonymous'
        },
        module: {
            rules: [...jsLoader(conf), ...cssLoader(conf), ...assetsLoader(conf)]
        },
        plugins: plugins(conf),
        optimization: optimization(conf)
    };
}

module.exports = main;
