const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WriteWebpackPlugin = require('write-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const SriPlugin = require('webpack-subresource-integrity');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const SriStripPlugin = require('./sri-strip-plugin');
const transformOpenpgpFiles = require('./helpers/openpgp');
const { OPENPGP_FILES } = require('./constants');

const { logo, ...logoConfig } = require(path.resolve('./src/assets/logoConfig.js'));

const HTML_MINIFY = {
    removeAttributeQuotes: true,
    collapseWhitespace: true,
    html5: true,
    minifyCSS: true,
    removeComments: true,
    removeEmptyAttributes: true,
};

const PRODUCTION_PLUGINS = [
    new OptimizeCSSAssetsPlugin({
        cssProcessorPluginOptions: {
            preset: [
                'default',
                {
                    reduceInitial: false,
                    discardComments: {
                        removeAll: true,
                    },
                    svgo: false,
                },
            ],
        },
    }),
];

module.exports = ({ isProduction, publicPath, appMode, buildData, featureFlags, writeSRI }) => {
    const { main, worker, elliptic, compat, definition } = transformOpenpgpFiles(
        OPENPGP_FILES,
        publicPath,
        isProduction
    );

    return [
        ...(isProduction
            ? [new webpack.HashedModuleIdsPlugin()]
            : [
                  new webpack.HotModuleReplacementPlugin(),
                  new webpack.NamedModulesPlugin(),
                  new ReactRefreshWebpackPlugin({
                      overlay: false,
                  }),
              ]),

        new WriteWebpackPlugin(
            [main, compat, elliptic, worker].map(({ filepath, contents }) => ({
                name: filepath,
                data: Buffer.from(contents),
            }))
        ),

        new WriteWebpackPlugin([
            {
                name: 'assets/version.json',
                data: Buffer.from(
                    JSON.stringify(
                        {
                            ...buildData,
                            mode: appMode,
                        },
                        null,
                        2
                    )
                ),
            },
        ]),

        new WriteWebpackPlugin([
            {
                name: 'assets/host.png',
                data: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
            },
        ]),

        new CopyWebpackPlugin({
            patterns: [
                { from: 'src/.htaccess' },
                // Fix max file limit if the folder does not exist
                fs.existsSync('public') && { from: 'public', noErrorOnMissing: true },
            ].filter(Boolean),
        }),

        new MiniCssExtractPlugin({
            filename: isProduction ? '[name].[contenthash:8].css' : '[name].css',
            chunkFilename: isProduction ? '[id].[contenthash:8].css' : '[id].css',
        }),

        new HtmlWebpackPlugin({
            template: path.resolve('./src/app.ejs'),
            inject: 'body',
            minify: isProduction && HTML_MINIFY,
        }),

        new FaviconsWebpackPlugin({
            logo: path.resolve(logo),
            ...logoConfig,
        }),

        ...(writeSRI
            ? [
                  new SriPlugin({
                      hashFuncNames: ['sha384'],
                      enabled: isProduction,
                  }),
                  new SriStripPlugin({
                      ignore: /\.css$/,
                  }),
              ]
            : []),

        new webpack.DefinePlugin({
            WEBPACK_OPENPGP: JSON.stringify(definition),
            WEBPACK_APP_MODE: JSON.stringify(appMode),
            WEBPACK_PUBLIC_PATH: JSON.stringify(publicPath),
            WEBPACK_FEATURE_FLAGS: JSON.stringify(featureFlags),
        }),

        new ScriptExtHtmlWebpackPlugin({
            defaultAttribute: 'defer',
        }),

        new webpack.SourceMapDevToolPlugin({
            test: /.js$/,
            filename: '[file].map',
        }),

        ...(isProduction ? PRODUCTION_PLUGINS : []),
    ].filter(Boolean);
};
