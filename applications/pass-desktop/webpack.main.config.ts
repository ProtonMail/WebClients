import plugins from './webpack.plugins';
import rules from './webpack.rules';

/**
 * @type {import('webpack').Configuration}
 */
export default {
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
