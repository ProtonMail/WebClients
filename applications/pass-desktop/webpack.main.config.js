const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');

/**
 * @type {import('webpack').Configuration}
 */
module.exports = {
    /**
     * This is the main entry point for your application, it's the first file
     * that runs in the main process.
     */
    entry: './src/main.ts',
    // Put your normal webpack config below here
    module: {
        rules,
    },
    optimization: {
        minimize: false,
    },
    plugins,
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
    },
};
