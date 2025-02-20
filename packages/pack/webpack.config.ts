import path from 'path';
import type { Configuration } from 'webpack';
import 'webpack-dev-server';
// @ts-ignore
import { parseResource } from 'webpack/lib/util/identifier';

import { getEntries } from './webpack/entries';

const getCssLoaders = require('./webpack/css.loader');
const getAssetsLoaders = require('./webpack/assets.loader');
const getPlugins = require('./webpack/plugins');
const getOptimizations = require('./webpack/optimization');

const getConfig = (env: any): Configuration => {
    const isProduction = process.env.NODE_ENV === 'production';
    const isRelease = !!process.env.CI_COMMIT_TAG;

    // This folder is separate from the assets folder because they are special assets which get served through
    // a long-term storage
    const assetsFolder = 'assets/static';

    const { getJsLoaders } = require(env.webpackOnCaffeine ? './webpack/js.loader.swc' : './webpack/js.loader');

    const defaultBrowsersList = isProduction
        ? `> 0.5%, not IE 11, Firefox ESR, Safari 14, iOS 14, Chrome 80`
        : 'last 1 chrome version, last 1 firefox version, last 1 safari version';

    const options = {
        isProduction,
        isRelease,
        publicPath: env.publicPath || '/',
        api: env.api,
        appMode: env.appMode || 'standalone',
        webpackOnCaffeine: env.webpackOnCaffeine,
        featureFlags: env.featureFlags || '',
        writeSRI: env.writeSri !== 'false',
        inlineIcons: env.inlineIcons === 'true',
        browserslist: env.browserslist ?? defaultBrowsersList,
        buildData: {
            version: env.version,
            commit: env.commit,
            branch: env.branch,
            date: env.date,
            mode: env.appMode,
        },
        warningLogs: env.warningLogs || false,
        errorLogs: env.errorLogs || false,
        overlayWarnings: env.overlayWarnings || false,
        overlayErrors: env.overlayErrors || false,
        overlayRuntimeErrors: env.overlayRuntimeErrors || false,
        logical: env.logical || false,
        analyze: env.analyze || false,
        optimizeAssets: env.optimizeAssets || false,
        handleSupportAndErrors: env.handleSupportAndErrors || false,
    };

    return {
        target: `browserslist:${options.browserslist}`,
        mode: isProduction ? 'production' : 'development',
        bail: isProduction,
        devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
        watchOptions: {
            ignored: /dist|node_modules|locales|\.(gif|jpeg|jpg|ico|png|svg)/,
            aggregateTimeout: 600,
        },
        resolve: {
            extensions: ['.js', '.tsx', '.ts'],
            fallback: {
                crypto: false,
                buffer: false,
                stream: false,
                iconv: false,
                path: false,
                punycode: false,
            },
        },
        experiments: { asyncWebAssembly: true },
        entry: getEntries(options.handleSupportAndErrors),
        output: {
            filename: isProduction ? `${assetsFolder}/[name].[contenthash:8].js` : `${assetsFolder}/[name].js`,
            publicPath: options.publicPath,
            chunkFilename: (pathData) => {
                const result = isProduction
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
            crossOriginLoading: 'anonymous',
        },
        module: {
            strictExportPresence: true, // Make missing exports an error instead of warning
            rules: [...getJsLoaders(options), ...getCssLoaders(options), ...getAssetsLoaders(options)],
        },
        plugins: getPlugins({
            ...options,
            cssName: isProduction ? `${assetsFolder}/[name].[contenthash:8].css` : `${assetsFolder}/[name].css`,
        }),
        optimization: getOptimizations(options),
        devServer: {
            hot: !isProduction,
            devMiddleware: {
                stats: 'minimal',
                publicPath: options.publicPath,
            },
            allowedHosts: 'all',
            compress: true,
            historyApiFallback: {
                index: options.publicPath,
            },
            client: {
                webSocketURL: 'auto://0.0.0.0:0/ws',
                overlay: {
                    warnings: options.overlayWarnings,
                    errors: options.overlayErrors,
                    runtimeErrors: options.overlayRuntimeErrors,
                },
            },
            webSocketServer: 'ws',
            ...(options.api && {
                proxy: [
                    {
                        context: ['/api', '/internal-api'],
                        target: options.api,
                        secure: false,
                        changeOrigin: true,
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
                    },
                ],
            }),
        },
    };
};

export default getConfig;
