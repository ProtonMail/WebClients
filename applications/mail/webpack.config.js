const webpack = require('webpack');
const getConfig = require('@proton/pack/webpack.config');

module.exports = (...env) => {
    const config = getConfig(...env);
    return {
        ...config,
        resolve: {
            ...config.resolve,
            fallback: {
                ...config.resolve.fallback,
                buffer: require.resolve('buffer'),
            },
        },
        plugins: [
            ...config.plugins,
            new webpack.ProvidePlugin({
                // It's required by the lib rfc2047 which is used by mimemessage.js
                // Without it any mimemessage with an attachment including special char will fail
                Buffer: [require.resolve('buffer'), 'Buffer'],
            }),
        ],
    };
};
