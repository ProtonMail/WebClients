const { DefinePlugin } = require('webpack');

module.exports = [
    new DefinePlugin({
        ENV: JSON.stringify(process.env.NODE_ENV ?? 'development'),
        BUILD_TARGET: JSON.stringify('desktop'),
        OFFLINE_SUPPORTED: true,
    }),
];
