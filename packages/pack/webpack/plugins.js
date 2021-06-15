const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WriteWebpackPlugin = require('write-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const imageminMozjpeg = require('imagemin-mozjpeg');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const SriPlugin = require('webpack-subresource-integrity');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const { getSource } = require('./helpers/source');
const transformOpenpgpFiles = require('./helpers/openpgp');
const { OPENPGP_FILES } = require('./constants');

const { logo, ...logoConfig } = require(getSource('src/assets/logoConfig.js'));

const HTML_MINIFY = {
    removeAttributeQuotes: true,
    collapseWhitespace: true,
    html5: true,
    minifyCSS: true,
    removeComments: true,
    removeEmptyAttributes: true
};

const PRODUCTION_PLUGINS = [
    new OptimizeCSSAssetsPlugin({
        cssProcessorPluginOptions: {
            preset: [
                'default',
                {
                    reduceInitial: false,
                    discardComments: {
                        removeAll: true
                    },
                    svgo: false
                }
            ]
        }
    }),
    new ImageminPlugin({
        cacheFolder: path.resolve('./node_modules/.cache'),
        maxConcurrency: Infinity,
        disable: false,
        test: /\.(jpe?g|png)$/i,
        optipng: {
            optimizationLevel: 7
        },
        pngquant: {
            quality: '80-100'
        },
        jpegtran: {
            progressive: true
        },
        plugins: [
            imageminMozjpeg({
                quality: 80,
                progressive: true
            })
        ]
    })
];

module.exports = ({ isProduction, publicPath, appMode, featureFlags, writeSRI }) => {
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
                      overlay: false
                  })
              ]),

        new WriteWebpackPlugin(
            [main, compat, elliptic, worker].map(({ filepath, contents }) => ({
                name: filepath,
                data: Buffer.from(contents)
            }))
        ),

        new WriteWebpackPlugin([
            { name: 'assets/host.png', data: Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64') }
        ]),

        // Fix max file limit if the folder does not exist
        fs.existsSync('public') &&
            new CopyWebpackPlugin({
                patterns: [{ from: 'public', noErrorOnMissing: true }]
            }),

        new MiniCssExtractPlugin({
            filename: isProduction ? '[name].[contenthash:8].css' : '[name].css',
            chunkFilename: isProduction ? '[id].[contenthash:8].css' : '[id].css'
        }),

        new HtmlWebpackPlugin({
            template: getSource('src/app.ejs'),
            inject: 'body',
            minify: isProduction && HTML_MINIFY
        }),

        new FaviconsWebpackPlugin({
            logo: getSource(logo),
            ...logoConfig
        }),

        ...(writeSRI
            ? [
                  new SriPlugin({
                      hashFuncNames: ['sha384'],
                      enabled: isProduction
                  })
              ]
            : []),

        new webpack.DefinePlugin({
            WEBPACK_OPENPGP: JSON.stringify(definition),
            WEBPACK_APP_MODE: JSON.stringify(appMode),
            WEBPACK_PUBLIC_PATH: JSON.stringify(publicPath),
            WEBPACK_FEATURE_FLAGS: JSON.stringify(featureFlags)
        }),

        new ScriptExtHtmlWebpackPlugin({
            defaultAttribute: 'defer'
        }),

        new webpack.SourceMapDevToolPlugin({
            test: /.js$/,
            filename: '[file].map'
        }),

        ...(isProduction ? PRODUCTION_PLUGINS : [])
    ].filter(Boolean);
};
