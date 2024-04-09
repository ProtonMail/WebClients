const { DefinePlugin } = require('webpack');
const { platform } = require('os');

module.exports = [
    new DefinePlugin({
        BUILD_TARGET: JSON.stringify(platform()),
        ENV: JSON.stringify(process.env.NODE_ENV ?? 'development'),
        OFFLINE_SUPPORTED: true,
    }),
];
