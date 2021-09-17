const webpack = require('webpack');
const getConfig = require('@proton/pack/webpack.config');

/**
 * There are some specific references to Buffer in the drive application,
 * e.g. MimeTypes so it has to be polyfilled
 */
module.exports = (...env) => {
    const config = getConfig(...env);
    return {
        ...config,
        resolve: {
            ...config.resolve,
            extensions: ['.js', '.tsx', '.ts', '...'], // ... is there to include default extensions for proper building of type script web workers.
            fallback: {
                ...config.resolve.fallback,
                buffer: require.resolve('buffer'),
                path: require.resolve('path-browserify'),
            },
        },
        plugins: [
            ...config.plugins,
            new webpack.ProvidePlugin({
                Buffer: [require.resolve('buffer'), 'Buffer'],
            }),
        ],
    };
};
