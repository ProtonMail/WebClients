const webpack = require('webpack');
const { produce, setAutoFreeze } = require('immer');
const getConfig = require('@proton/pack/webpack.config');

module.exports = (...env) => {
    setAutoFreeze(false);

    return produce(getConfig(...env), (config) => {
        config.resolve.fallback.buffer = require.resolve('buffer');
        config.plugins.push(
            new webpack.ProvidePlugin({
                // It's required by the lib rfc2047 which is used by mimemessage.js
                // Without it any mimemessage with an attachment including special char will fail
                Buffer: [require.resolve('buffer'), 'Buffer'],
            })
        );
    });
};
