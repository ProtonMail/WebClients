const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const imageminMozjpeg = require('imagemin-mozjpeg');
const WebpackNotifierPlugin = require('webpack-notifier');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const AutoDllPlugin = require('autodll-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const CONFIG = require('../env/conf.build');
const env = require('../env/config');

const makeSRC = (list) => list.map((file) => path.resolve(file));
const [OPENPGP_WORKER] = makeSRC(CONFIG.externalFiles.openpgp);

const minify = () => {
    return {
        removeAttributeQuotes: true,
        collapseWhitespace: true,
        html5: true,
        minifyCSS: true,
        removeComments: true,
        removeEmptyAttributes: true
    };
};

const list = [
    new webpack.NamedModulesPlugin(),
    // new WebpackNotifierPlugin(),
    new CopyWebpackPlugin([
        { from: CONFIG.vendor_files.fonts[0], to: 'assets/fonts/' },
        { from: 'src/i18n', to: 'i18n' },
        { from: OPENPGP_WORKER, to: 'openpgp.worker.min.js' }
    ]),

    new CopyWebpackPlugin([{ from: 'src/assets', to: 'assets' }]),

    new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename: 'styles.css'
    }),

    new HtmlWebpackPlugin({
        template: 'src/app.html',
        inject: 'body',
        hash: false,
        excludeChunks: ['html', 'app.css'],
        chunks: ['vendor-app', 'app'],
        chunksSortMode: 'manual',
        minify: minify()
    }),

    new webpack.SourceMapDevToolPlugin({
        filename: '[name].js.map',
        exclude: ['templates', 'html', 'styles']
    })
];

if (!env.isDistRelease()) {
    // cf https://github.com/mzgoddard/hard-source-webpack-plugin/issues/301
    // list.unshift(new HardSourceWebpackPlugin());
    list.push(
        new AutoDllPlugin({
            inject: true, // will inject the DLL bundles to index.html
            filename: '[name]_[hash].js'
        })
    );
}

if (env.isDistRelease()) {
    list.push(new OptimizeCSSAssetsPlugin({}));

    list.push(
        new ImageminPlugin({
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
            ],
            cacheFolder: path.resolve('./node_modules/.cache/imagemin'),
        })
    );
}

module.exports = list;
