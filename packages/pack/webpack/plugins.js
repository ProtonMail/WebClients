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
const PostCssLogicalWebpackPlugin = require('./postcss-logical-webpack-plugin').default;
const WriteWebpackPlugin = require('./write-webpack-plugin').default;
const HtmlEditWebpackPlugin = require('./html-edit-webpack-plugin').default;
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const SriWebpackPlugin = require('./sri-webpack-plugin').default;
const WebpackInvalidationPlugin = require('./benchmark-apps-build/WebpackInvalidation').WebpackInvalidation;

const defaultFaviconConfig = require('./favicon.config');
const faviconConfig = require(path.resolve('./favicon.config.js'));
const { getIndexChunks } = require('../webpack/entries');

const { CI } = process.env;

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
    noLogicalScss,
    cssName,
    analyze,
    defineWebpackConfig,
    benchmarkBuild,
    prependAsyncCss,
    ignoreCssOrderWarning,
}) => {
    let WebpackCollectMetricsPlugin;

    if (CI) {
        // eslint-disable-next-line import/no-extraneous-dependencies
        WebpackCollectMetricsPlugin = require('@proton/collect-metrics').WebpackCollectMetricsPlugin;
    }

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
                          failOnError: false,
                          failOnWarning: false,
                          // ESLint class options
                          cwd: path.resolve('.'),
                          cache: true,
                      }),
                  (warningLogs || errorLogs) &&
                      new ForkTsCheckerWebpackPlugin({
                          typescript: {
                              memoryLimit: 4096,
                          },
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
            ...(ignoreCssOrderWarning
                ? {
                      ignoreOrder: true,
                  }
                : undefined),
            ...(prependAsyncCss
                ? {
                      insert: function (linkTag) {
                          const firstStylesheet = document.head.querySelector('link[rel="stylesheet"]');
                          if (firstStylesheet) {
                              firstStylesheet.parentNode.insertBefore(linkTag, firstStylesheet);
                          } else {
                              document.head.appendChild(linkTag);
                          }
                      },
                  }
                : undefined),
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
            chunks: getIndexChunks('index'),
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
            logoMaskable: path.resolve(faviconConfig.logoMaskable),
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
                  new HtmlEditWebpackPlugin((tag) => {
                      const src = tag.attributes.href || tag.attributes.src;
                      // Remove the integrity and crossorigin attributes for these files because we don't
                      // want to validate them since we may override the server response on these assets
                      // for certain scenarios.
                      if (/\.(css|png|svg|ico|json)(?:\?.+)?$/.test(src)) {
                          if (tag.attributes.integrity || tag.attributes.crossorigin) {
                              delete tag.attributes.integrity;
                              delete tag.attributes.crossorigin;
                          }
                      }
                      return tag;
                  }),
              ]
            : []),

        new SriWebpackPlugin(),

        new HtmlEditWebpackPlugin((tag) => {
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
        }),

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

        defineWebpackConfig &&
            new webpack.DefinePlugin(
                Object.fromEntries(
                    Object.entries(defineWebpackConfig).map(([key, value]) => [
                        `process.env.${key}`,
                        JSON.stringify(value),
                    ])
                )
            ),

        !noLogicalScss && new PostCssLogicalWebpackPlugin(),

        analyze &&
            new BundleAnalyzerPlugin({
                excludeAssets: `assets/static/locales`,
            }),

        CI && new WebpackCollectMetricsPlugin(buildData),
        benchmarkBuild && new WebpackInvalidationPlugin(),
    ].filter(Boolean);
};
