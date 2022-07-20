const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const { SubresourceIntegrityPlugin } = require('webpack-subresource-integrity');

const WriteWebpackPlugin = require('./write-webpack-plugin');
const SriStripPlugin = require('./sri-strip-plugin');

const defaultFaviconConfig = require('./favicon.config');
const faviconConfig = require(path.resolve('./favicon.config.js'));

module.exports = ({ isProduction, publicPath, appMode, buildData, featureFlags, writeSRI, warningLogs, errorLogs }) => {
    return [
        ...(isProduction
            ? []
            : [
                  new ReactRefreshWebpackPlugin({
                      overlay: false,
                  }),
                  (warningLogs || errorLogs) &&
                      new ESLintPlugin({
                          extensions: ['js', 'ts', 'tsx'],
                          eslintPath: require.resolve('eslint'),
                          context: path.resolve('.'),
                          emitWarning: warningLogs,
                          emitError: errorLogs,
                          // ESLint class options
                          resolvePluginsRelativeTo: __dirname,
                          cwd: path.resolve('.'),
                          cache: true,
                      }),
                  (warningLogs || errorLogs) &&
                      new ForkTsCheckerWebpackPlugin({
                          async: true,
                          formatter: 'basic',
                          issue: {
                              include: (issue) => {
                                  if (warningLogs && issue.severity === 'warning') {
                                      return true;
                                  }
                                  if (errorLogs && issue.severity === 'error') {
                                      return true;
                                  }
                                  return false;
                              },
                          },
                      }),
              ]),

        new CopyWebpackPlugin({
            patterns: [
                {
                    from: `${path.dirname(require.resolve('push.js'))}/serviceWorker.min.js`,
                    to: 'assets/serviceWorker.min.js',
                },
            ],
        }),

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
            templateParameters: {
                appName: faviconConfig.favicons.appName,
                appDescription: faviconConfig.favicons.appDescription,
                url: faviconConfig.url,
                locales: faviconConfig.locales,
            },
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
            logo: path.resolve(faviconConfig.logo),
            cache: path.resolve('./node_modules/.cache'),
            favicons: {
                version: buildData.version,
                ...defaultFaviconConfig,
                ...faviconConfig.favicons,
            },
        }),

        ...(writeSRI
            ? [
                  new SubresourceIntegrityPlugin(),
                  new SriStripPlugin({
                      ignore: /\.(css|png|svg|ico|json)$/,
                      handle: (tag) => {
                          // With enabling the loadManifestWithCredentials option in the FaviconsWebpackPlugin the
                          // crossorigin attribute for the manifest.json link is added correctly, however the SRI
                          // plugin removes it and replaces it with SRI attributes. This plugin then removes the SRI
                          // attributes for the tags which we're not interested to have SRI on, but it also adds
                          // back the use-credentials crossorigin attribute for the manifest link.
                          if (tag.tagName === 'link' && tag.attributes.href.endsWith('manifest.json')) {
                              tag.attributes.crossorigin = 'use-credentials';
                          }
                      },
                  }),
              ]
            : []),

        new webpack.DefinePlugin({
            WEBPACK_APP_MODE: JSON.stringify(appMode),
            WEBPACK_PUBLIC_PATH: JSON.stringify(publicPath),
            WEBPACK_FEATURE_FLAGS: JSON.stringify(featureFlags),
        }),
    ].filter(Boolean);
};
