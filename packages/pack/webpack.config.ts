import path from 'path';
import { Configuration } from 'webpack';
import 'webpack-dev-server';
// @ts-ignore
import { parseResource } from 'webpack/lib/util/identifier';

import { getEntries } from './webpack/entries';

const { getJsLoaders } = require('./webpack/js.loader');
const getCssLoaders = require('./webpack/css.loader');
const getAssetsLoaders = require('./webpack/assets.loader');
const getPlugins = require('./webpack/plugins');
const getOptimizations = require('./webpack/optimization');

const getConfig = (env: any): Configuration => {
    const isProduction = process.env.NODE_ENV === 'production';
    const isRelease = !!process.env.CI_COMMIT_TAG;

    const assetsFolder = 'assets';

    const options = {
        isProduction,
        isRelease,
        publicPath: env.publicPath || '/',
        api: env.api,
        appMode: env.appMode || 'standalone',
        featureFlags: env.featureFlags || '',
        writeSRI: env.writeSri !== 'false',
        browserslist: isProduction
            ? `> 0.5%, not IE 11, Firefox ESR, Safari 11`
            : 'last 1 chrome version, last 1 firefox version, last 1 safari version',
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
    };

    const version = options.buildData.version;

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
        entry: getEntries(),
        output: {
            filename: isProduction
                ? `${assetsFolder}/[name].[contenthash:8].js?v=${version}`
                : `${assetsFolder}/[name].js?v=${version}`,
            publicPath: options.publicPath,
            chunkFilename: (pathData) => {
                const result = isProduction
                    ? `${assetsFolder}/[name].[contenthash:8].chunk.js?v=${version}`
                    : `${assetsFolder}/[name].chunk.js?v=${version}`;
                const chunkName = pathData?.chunk?.name;
                if (chunkName && (chunkName.startsWith('date-fns/') || chunkName.startsWith('locales/'))) {
                    // @ts-ignore
                    const strippedChunkName = chunkName.replaceAll(/-index-js|-json/g, '');
                    return result.replace('[name]', strippedChunkName);
                }
                // Drive need static URL for transpiled SW
                if (chunkName && chunkName.startsWith('downloadSW')) {
                    return `[name].js?v=${version}`;
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
                    return `${assetsFolder}/${replacedNamed}.[hash][ext]?v=${version}`;
                }
                return `${assetsFolder}/[name].[hash][ext]?v=${version}`;
            },
            crossOriginLoading: 'anonymous',
        },
        cache: {
            type: 'filesystem',
            cacheDirectory: path.resolve('./node_modules/.cache/webpack'),
            buildDependencies: {
                defaultWebpack: ['webpack/lib/'],
                config: [__filename],
            },
        },
        module: {
            strictExportPresence: true, // Make missing exports an error instead of warning
            rules: [...getJsLoaders(options), ...getCssLoaders(options), ...getAssetsLoaders()],
        },
        plugins: getPlugins({
            ...options,
            cssName: isProduction
                ? `${assetsFolder}/[name].[contenthash:8].css?v=${version}`
                : `${assetsFolder}/[name].css?v=${version}`,
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
