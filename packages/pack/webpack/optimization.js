const TerserPlugin = require('terser-webpack-plugin');

const minimizer = [
    new TerserPlugin({
        exclude: /\/node_modules\/(?!(asmcrypto\.js|pmcrypto))/,
        cache: true,
        parallel: true,
        sourceMap: true,
        terserOptions: {
            mangle: true,
            compress: true,
            safari10: true
        }
    })
];

module.exports = ({ isProduction }) => ({
    splitChunks: {
        // Share all chunks between async and sync bundles https://webpack.js.org/plugins/split-chunks-plugin/#splitchunks-chunks
        chunks: 'all',
        name: true
    },
    minimize: isProduction,
    minimizer
});
