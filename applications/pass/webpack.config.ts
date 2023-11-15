import webpack from 'webpack';

import getConfig from '@proton/pack/webpack.config';

const result = (env: any): webpack.Configuration => {
    const result = getConfig(env);
    const version = env.version;

    result.plugins?.push(
        new webpack.DefinePlugin({
            ENV: JSON.stringify(process.env.NODE_ENV ?? 'development'),
        })
    );

    if (result.devServer) result.devServer.headers = { 'Service-Worker-Allowed': '/' };

    if (result.output) {
        const chunkFilename = result.output.chunkFilename;
        result.output.chunkFilename = (pathData, assetInfo) => {
            const chunkName = pathData?.chunk?.name;
            if (chunkName && chunkName.startsWith('pass.service-worker')) return `[name].js?v=${version}`;
            if (typeof chunkFilename === 'function') return chunkFilename(pathData, assetInfo);
            return chunkFilename ?? '[id].js';
        };
    }

    return result;
};

export default result;
