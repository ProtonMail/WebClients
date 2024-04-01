const { DefinePlugin } = require('webpack');
const { platform } = require('os');

module.exports = [
    new DefinePlugin({
        ENV: JSON.stringify(process.env.NODE_ENV ?? 'development'),
        BUILD_TARGET: JSON.stringify(platform()),
    }),
];
