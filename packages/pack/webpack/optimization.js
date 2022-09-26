const os = require('os');
const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

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

module.exports = ({ isProduction }) => ({
    // Needs to be single because we embed two entry points
    runtimeChunk: 'single',
    minimize: isProduction,
    minimizer: [
        new TerserPlugin({
            // openpgp and elliptic are written into assets with WriteWebpackPlugin and get minified
            exclude: /\/node_modules\/(?!(asmcrypto\.js|pmcrypto))|openpgp|elliptic/,
            extractComments: false,
            parallel: !isWSL(),
            terserOptions: {
                keep_classnames: isProduction,
                keep_fnames: isProduction,
            },
        }),
        new CssMinimizerPlugin(),
    ],
    splitChunks: {
        chunks(chunk) {
            return chunk.name !== 'crypto-worker';
        },
    },
});
