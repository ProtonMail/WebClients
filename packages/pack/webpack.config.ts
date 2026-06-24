import browserslist from 'browserslist';
import path from 'path';
import type { Configuration } from 'webpack';
import 'webpack-dev-server';
// @ts-ignore
import { parseResource } from 'webpack/lib/util/identifier';

import type { WebpackOptions } from './lib/interface';
import { getEntries } from './webpack/entries';

const jsBabelLoader = require('./webpack/js.loader');
const jsSwcLoader = require('./webpack/js.loader.swc');
const getCssLoaders = require('./webpack/css.loader');
const getAssetsLoaders = require('./webpack/assets.loader');
const getPlugins = require('./webpack/plugins');
const getOptimizations = require('./webpack/optimization');

export { addDevEntry } from './webpack/entries';

export const getConfig = (webpackOptions: WebpackOptions): Configuration => {
    // This folder is separate from the assets folder because they are special assets which get served through
    // a long-term storage
    const assetsFolder = 'assets/static';

    // The webpack target resolves the env section straight from the root .browserslistrc (see `target`
    // below). The babel/css loaders need the resolved query, so derive it from the same env to keep them
    // in sync, unless an app supplied an explicit override. (webpack only accepts an env name or config
    // path in `browserslist:<...>`, not a raw query, once a .browserslistrc is discoverable.)
    const browserslistQuery =
        webpackOptions.browserslist ?? browserslist(null, { env: webpackOptions.browserslistEnv }).join(', ');
    const loaderOptions = { ...webpackOptions, browserslist: browserslistQuery };

    return {
        bail: webpackOptions.isProduction,
        devServer: {
            allowedHosts: 'all',
            client: {
                overlay: {
                    errors: webpackOptions.overlayErrors,
                    runtimeErrors: webpackOptions.overlayRuntimeErrors,
                    warnings: webpackOptions.overlayWarnings,
                },
                webSocketURL: 'auto://0.0.0.0:0/ws',
            },
            compress: true,
            devMiddleware: {
                publicPath: webpackOptions.publicPath,
                stats: 'minimal',
            },
            historyApiFallback: {
                index: webpackOptions.publicPath,
            },
            hot: !webpackOptions.isProduction,
            webSocketServer: 'ws',
            ...(webpackOptions.api && {
                proxy: [
                    {
                        changeOrigin: true,
                        context: ['/api', '/internal-api'],
                        onProxyRes: (proxyRes) => {
                            delete proxyRes.headers['content-security-policy'];
                            delete proxyRes.headers['x-frame-options'];
                            proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie']?.map((cookies) =>
                                cookies
                                    .split('; ')
                                    .filter((cookie) => {
                                        return !/(secure$|samesite=|domain=)/i.test(cookie);
                                    })
                                    .join('; ')
                            );
                        },
                        secure: false,
                        target: webpackOptions.api,
                    },
                ],
            }),
        },
        devtool: webpackOptions.isProduction ? 'source-map' : 'cheap-module-source-map',
        entry: getEntries(webpackOptions.handleSupportAndErrors),
        experiments: { asyncWebAssembly: true },
        mode: webpackOptions.isProduction ? 'production' : 'development',
        module: {
            rules: [
                ...(webpackOptions.babelLoader
                    ? jsBabelLoader.getJsLoaders(loaderOptions)
                    : jsSwcLoader.getJsLoaders(loaderOptions)),
                ...getCssLoaders(loaderOptions),
                ...getAssetsLoaders(webpackOptions),
            ],
            strictExportPresence: true, // Make missing exports an error instead of warning
        },
        optimization: getOptimizations(webpackOptions),
        output: {
            assetModuleFilename: (data) => {
                const { path: file } = parseResource(data?.filename || '');
                const ext = path.extname(file);
                const base = path.basename(file);
                const name = base.slice(0, base.length - ext.length);
                if (name.includes('.var')) {
                    const replacedNamed = name.replace('.var', '-var');
                    return `${assetsFolder}/${replacedNamed}.[hash][ext]`;
                }
                return `${assetsFolder}/[name].[hash][ext]`;
            },
            chunkFilename: (pathData) => {
                const result = webpackOptions.isProduction
                    ? `${assetsFolder}/[name].[contenthash:8].chunk.js`
                    : `${assetsFolder}/[name].chunk.js`;
                const chunkName = pathData?.chunk?.name;
                if (chunkName && (chunkName.startsWith('date-fns/') || chunkName.startsWith('locales/'))) {
                    // @ts-ignore
                    const strippedChunkName = chunkName.replaceAll(/-index-js|-json/g, '');
                    return result.replace('[name]', strippedChunkName);
                }
                // Drive need static URL for transpiled SW
                // Must not be versioned
                // https://web.dev/learn/pwa/service-workers/#update
                if (chunkName && chunkName.startsWith('downloadSW')) {
                    return `[name].js`;
                }
                return result;
            },
            crossOriginLoading: 'anonymous',
            filename: webpackOptions.isProduction
                ? `${assetsFolder}/[name].[contenthash:8].js`
                : `${assetsFolder}/[name].js`,
            publicPath: webpackOptions.publicPath,
        },
        plugins: getPlugins({
            ...webpackOptions,
            cssName: webpackOptions.isProduction
                ? `${assetsFolder}/[name].[contenthash:8].css`
                : `${assetsFolder}/[name].css`,
        }),
        resolve: {
            extensions: ['.js', '.tsx', '.ts'],
            fallback: {
                assert: false,
                buffer: false,
                child_process: false,
                crypto: false,
                fs: false,
                iconv: false,
                os: false,
                path: false,
                punycode: false,
                stream: false,
            },
        },
        target: `browserslist:${webpackOptions.browserslistEnv}`,
        watchOptions: {
            aggregateTimeout: 600,
            ignored: /dist|node_modules|locales|\.(gif|jpeg|jpg|ico|png|svg)/,
        },
    };
};

export default getConfig;
