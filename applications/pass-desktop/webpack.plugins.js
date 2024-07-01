const { DefinePlugin } = require('webpack');
const { platform } = require('os');

module.exports = [
    new DefinePlugin({
        BUILD_TARGET: JSON.stringify(platform()),
        DESKTOP_BUILD: true,
        ENV: JSON.stringify(process.env.NODE_ENV ?? 'development'),
        EXTENSION_BUILD: false,
        OFFLINE_SUPPORTED: true,
    }),
];
