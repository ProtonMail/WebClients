const path = require('path');
const webpack = require('webpack');
const glob = require('glob');
const ConcatPlugin = require('webpack-concat-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');
const imageminMozjpeg = require('imagemin-mozjpeg');

const CONFIG = require('../env/conf.build');
const env = require('../env/config');

const makeSRC = (list) => list.map((file) => path.resolve(file));
const [OPENPGP_WORKER, OPENPGP] = makeSRC(CONFIG.external_files.openpgp);
const VENDOR_GLOB = makeSRC(CONFIG.vendor_files.js);
const VENDOR_LIB_GLOB = makeSRC(glob.sync('./src/libraries/{polyfill,tweetWebIntent,mailparser}.js'));

const minify = () => {
    if (!env.isDistRelease()) {
        return false;
    }

    return {
        removeAttributeQuotes: true,
        collapseWhitespace: true,
        html5: true,
        minifyCSS: true,
        removeComments: true,
        removeEmptyAttributes: true
    };
};

const minifyJS = () => {
    if (!env.isDistRelease()) {
        return false;
    }

    return {
        mangle: true,
        compress: true
    };
};

const list = [
    new CopyWebpackPlugin([
        { from: 'src/manifest.json' },
        { from: 'src/.htaccess' },
        { from: CONFIG.vendor_files.fonts[0], to: 'assets/fonts/' },
        { from: 'src/i18n', to: 'i18n' },
        { from: OPENPGP_WORKER, to: 'openpgp.worker.min.js' }
    ]),

    new CopyWebpackPlugin([
        { from: 'src/assets/img/decrypt1.gif', to: 'assets/img' },
        { from: 'src/assets/img/small-spinner.gif', to: 'assets/img' },
        { from: 'src/assets', to: 'assets' }
    ]),

    new ImageminPlugin({
        maxConcurrency: Infinity,
        disable: !env.isDistRelease(),
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
    }),

    new ExtractTextPlugin('styles.css'),

    // No uglify here because it doesn't work (wtf)
    new ConcatPlugin({
        useHash: true,
        name: 'vendor',
        fileName: '[name].js?[hash]',
        filesToConcat: VENDOR_GLOB.concat(VENDOR_LIB_GLOB)
    }),

    new ConcatPlugin({
        useHash: true,
        name: 'openpgp',
        fileName: '[name].min.js?[hash]',
        filesToConcat: [OPENPGP]
    }),

    new HtmlWebpackIncludeAssetsPlugin({
        assets: ['openpgp.min.js', 'vendor.js'],
        append: false,
        hash: false
    }),

    new HtmlWebpackPlugin({
        template: 'src/app.html',
        inject: 'body',
        hash: false,
        excludeChunks: ['styles', 'html', 'app.css'],
        chunks: ['openpgp.min', 'vendor', 'templates', 'app'],
        chunksSortMode: 'manual',
        minify: minify()
    }),

    new webpack.SourceMapDevToolPlugin({
        filename: '[name].js.map',
        exclude: ['vendor', 'templates', 'html', 'styles', 'openpgp']
    })
];

if (env.isDistRelease()) {
    list.push(
        new UglifyJSPlugin({
            exclude: /\/node_modules/,
            parallel: true,
            sourceMap: true,
            uglifyOptions: minifyJS()
        })
    );
}

module.exports = list;
