const os = require('os');
const TerserPlugin = require('terser-webpack-plugin');

/**
 * parallel doesn't work yet for WSL (GNU/Linux on Windows)
 * cf https://github.com/webpack-contrib/terser-webpack-plugin/issues/21
 * https://github.com/webpack-contrib/uglifyjs-webpack-plugin/issues/302
 * @return {Boolean} true if WSL
 */
const isWSL = () => {
    if (process.platform === 'linux' && os.release().includes('Microsoft')) {
        return true;
    }

    return false;
};

const minimizer = [
    new TerserPlugin({
        exclude: /\/node_modules\/(?!(asmcrypto\.js|pmcrypto))/,
        cache: true,
        extractComments: false,
        parallel: !isWSL(),
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
