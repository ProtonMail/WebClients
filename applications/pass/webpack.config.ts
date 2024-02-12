import path from 'path';
import webpack from 'webpack';

import getConfig from '@proton/pack/webpack.config';

const result = (env: any): webpack.Configuration => {
    const config = getConfig(env);
    const version = env.version;

    config.plugins?.push(
        new webpack.DefinePlugin({
            ENV: JSON.stringify(process.env.NODE_ENV ?? 'development'),
            BUILD_TARGET: JSON.stringify('web'),
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

    return config;
};

export default result;
