const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WriteWebpackPlugin = require('write-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const imageminMozjpeg = require('imagemin-mozjpeg');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const AutoDllPlugin = require('autodll-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const ScriptExtHtmlWebpackPlugin = require('script-ext-html-webpack-plugin');
const SriPlugin = require('webpack-subresource-integrity');

const { getSource } = require('./helpers/source');
const transformOpenpgpFiles = require('./helpers/openpgp');
const { OPENPGP_FILES, OPENPGP_WORKERS, CHECK_COMPAT_APP } = require('./constants');

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
                    }
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

module.exports = ({ isProduction, publicPath, appMode }) => {
    const { main, worker, compat, definition } = transformOpenpgpFiles(
        OPENPGP_FILES,
        OPENPGP_WORKERS[0],
        publicPath,
        isProduction
    );

    return [
        ...(isProduction
            ? [new webpack.HashedModuleIdsPlugin()]
            : [new webpack.HotModuleReplacementPlugin(), new webpack.NamedModulesPlugin()]),

        new WriteWebpackPlugin(
            [main, compat, worker].map(({ filepath, contents }) => ({
                name: filepath,
                data: Buffer.from(contents)
            }))
        ),

        new CopyWebpackPlugin([{ from: 'src/i18n', to: 'i18n' }]),

        new MiniCssExtractPlugin({
            filename: isProduction ? '[name].[hash:8].css' : '[name].css',
            chunkFilename: isProduction ? '[id].[hash:8].css' : '[id].css'
        }),

        new HtmlWebpackPlugin({
            template: getSource('src/app.ejs'),
            inject: 'body',
            minify: isProduction && HTML_MINIFY
        }),

        new SriPlugin({
            hashFuncNames: ['sha384'],
            enabled: isProduction
        }),

        new webpack.DefinePlugin({
            PM_OPENPGP: JSON.stringify(definition),
            PL_IS_STANDALONE: appMode === 'standalone'
        }),

        new ScriptExtHtmlWebpackPlugin({
            defaultAttribute: 'defer'
        }),

        new webpack.SourceMapDevToolPlugin({
            filename: isProduction ? '[name].[hash:8].js.map' : '[name].js.map'
        }),

        ...(isProduction ? PRODUCTION_PLUGINS : [])
    ];
};
