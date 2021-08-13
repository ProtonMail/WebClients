const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const { SubresourceIntegrityPlugin } = require('webpack-subresource-integrity');

const WriteWebpackPlugin = require('./write-webpack-plugin');
const SriStripPlugin = require('./sri-strip-plugin');
const transformOpenpgpFiles = require('./helpers/openpgp');
const { OPENPGP_FILES } = require('./constants');

const { logo, ...logoConfig } = require(path.resolve('./src/assets/logoConfig.js'));

module.exports = ({ isProduction, publicPath, appMode, buildData, featureFlags, writeSRI }) => {
    const { main, worker, elliptic, compat, definition } = transformOpenpgpFiles(
        OPENPGP_FILES,
        publicPath,
        isProduction
    );

    return [
        ...(isProduction
            ? []
            : [
                  new webpack.HotModuleReplacementPlugin(),
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
                data: Buffer.from(JSON.stringify(buildData, null, 2)),
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
            scriptLoading: 'defer',
            minify: isProduction && {
                removeComments: true,
                collapseWhitespace: true,
                removeRedundantAttributes: true,
                useShortDoctype: true,
                removeEmptyAttributes: true,
                removeStyleLinkTypeAttributes: true,
                keepClosingSlash: true,
                minifyJS: true,
                minifyCSS: true,
                minifyURLs: true,
            },
        }),

        new FaviconsWebpackPlugin({
            logo: path.resolve(logo),
            ...logoConfig,
            cache: path.resolve('./node_modules/.cache'),
        }),

        ...(writeSRI
            ? [
                  new SubresourceIntegrityPlugin(),
                  new SriStripPlugin({
                      ignore: /\.(css|png|svg|ico|json)$/,
                  }),
              ]
            : []),

        new webpack.DefinePlugin({
            WEBPACK_OPENPGP: JSON.stringify(definition),
            WEBPACK_APP_MODE: JSON.stringify(appMode),
            WEBPACK_PUBLIC_PATH: JSON.stringify(publicPath),
            WEBPACK_FEATURE_FLAGS: JSON.stringify(featureFlags),
        }),
    ].filter(Boolean);
};
