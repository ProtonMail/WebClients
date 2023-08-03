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
const { RetryChunkLoadPlugin } = require('webpack-retry-chunk-load-plugin');
const SentryCliPlugin = require('@sentry/webpack-plugin');
const PostCssLogicalWebpackPlugin = require('./postcss-logical-webpack-plugin');

const WriteWebpackPlugin = require('./write-webpack-plugin');
const HtmlEditPlugin = require('./html-edit-plugin');

const defaultFaviconConfig = require('./favicon.config');
const faviconConfig = require(path.resolve('./favicon.config.js'));

module.exports = ({
    isProduction,
    isRelease,
    publicPath,
    appMode,
    buildData,
    featureFlags,
    writeSRI,
    warningLogs,
    errorLogs,
    logical,
    cssName,
}) => {
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

        /*
         * Sentry webpack plugin is only run on tag creation (IS_RELEASE_BUNDLE)
         * Needed values for source-maps upload
         * project: defined in sentry.properties of each app
         * org: defined in SENTRY_ORG (gitlab env)
         * url: defined in SENTRY_URL (gitlab env)
         * authToken: defined in SENTRY_AUTH_TOKEN (gitlab env)
         * */
        isRelease &&
            new SentryCliPlugin({
                include: './dist',
                ignore: ['node_modules', 'webpack.config.js'],
                configFile: 'sentry.properties',
                // This prevents build to fail if any issue happened
                errorHandler: (err, invokeErr, compilation) => {
                    compilation.warnings.push('Sentry CLI Plugin: ' + err.message);
                },
                release: buildData.version,
            }),

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
            filename: cssName,
            chunkFilename: cssName,
        }),

        new HtmlWebpackPlugin({
            template: path.resolve('./src/app.ejs'),
            templateParameters: {
                appName: faviconConfig.favicons.appName,
                title: faviconConfig.favicons.appName,
                description: faviconConfig.favicons.appDescription,
                url: faviconConfig.url,
                locales: faviconConfig.locales,
                ogImage: faviconConfig.ogImage,
                lang: 'en-US',
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
                  new HtmlEditPlugin((tag) => {
                      const src = tag.attributes.href || tag.attributes.src;
                      // Remove the integrity and crossorigin attributes for these files because we don't
                      // want to validate them since we may override the server response on these assets
                      // for certain scenarios.
                      if (/\.(css|png|svg|ico|json)$/.test(src)) {
                          if (tag.attributes.integrity || tag.attributes.crossorigin) {
                              delete tag.attributes.integrity;
                              delete tag.attributes.crossorigin;
                          }
                      }
                      return tag;
                  }, HtmlWebpackPlugin),
              ]
            : []),

        new HtmlEditPlugin((tag) => {
            // Remove the favicon.ico tag that the FaviconsWebpackPlugin generates because:
            // 1) We want it to be listed before the .svg icon that we manually inject
            // 2) We want it to have the sizes="any" attribute because of this chrome bug
            // https://twitter.com/subzey/status/1417099064949235712
            if (tag.tagName === 'link' && tag.attributes.href.endsWith('favicon.ico')) {
                return null;
            }
            // With enabling the loadManifestWithCredentials option in the FaviconsWebpackPlugin the
            // crossorigin attribute for the manifest.json link is added correctly, however the SRI
            // plugin removes it and replaces it with SRI attributes. This plugin adds back the use-credentials
            // crossorigin attribute for the manifest link.
            if (tag.tagName === 'link' && tag.attributes.href.endsWith('manifest.webmanifest')) {
                tag.attributes.crossorigin = 'use-credentials';
            }
            return tag;
        }, HtmlWebpackPlugin),

        new RetryChunkLoadPlugin({
            cacheBust: `function() {
      return Date.now();
    }`,
            retryDelay: 5000,
            maxRetries: 3,
        }),

        new webpack.DefinePlugin({
            WEBPACK_APP_MODE: JSON.stringify(appMode),
            WEBPACK_PUBLIC_PATH: JSON.stringify(publicPath),
            WEBPACK_FEATURE_FLAGS: JSON.stringify(featureFlags),
        }),

        logical && new PostCssLogicalWebpackPlugin(),
    ].filter(Boolean);
};
