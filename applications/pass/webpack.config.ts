import path from 'path';
import webpack from 'webpack';
import { WebpackManifestPlugin } from 'webpack-manifest-plugin';

import getConfig from '@proton/pack/webpack.config';

const CRITICAL_OFFLINE_ASSETS = ['index.html', 'index.js', 'index.css', 'runtime.js', 'pre.js', 'unsupported.js'];

const result = (env: any): webpack.Configuration => {
    const config = getConfig(env);
    const version = env.version;

    config.plugins?.push(
        new webpack.DefinePlugin({
            BUILD_TARGET: JSON.stringify('web'),
            ENV: JSON.stringify(process.env.NODE_ENV ?? 'development'),
            OFFLINE_SUPPORTED: process.env.OFFLINE === '1' || process.env.OFFLINE === 'true',
        })
    );

    if (config.resolve) config.resolve.alias = { 'proton-pass-web': path.resolve(__dirname, 'src/') };
    if (config.devServer) config.devServer.headers = { 'Service-Worker-Allowed': '/' };

    if (config.output) {
        const chunkFilename = config.output.chunkFilename;
        config.output.chunkFilename = (pathData, assetInfo) => {
            const chunkName = pathData?.chunk?.name;
            if (chunkName && chunkName.startsWith('pass.service-worker')) return `[name].js?v=${version}`;
            if (typeof chunkFilename === 'function') return chunkFilename(pathData, assetInfo);
            return chunkFilename ?? '[id].js';
        };
    }

    if (config.plugins) {
        config.plugins.push(
            new WebpackManifestPlugin({
                fileName: 'assets/offline.json',
                filter: (file) => CRITICAL_OFFLINE_ASSETS.includes(file.name),
            })
        );
    }

    return config;
};

export default result;
