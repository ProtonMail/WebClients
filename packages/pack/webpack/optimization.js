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

module.exports = /** @type { (env: any) => import('webpack').Options.Optimization } */ ({ isProduction }) => ({
    // Needs to be single because we embed two entry points
    runtimeChunk: 'single',
    minimize: isProduction,
    minimizer: [
        new TerserPlugin({
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
            // This is the default "async" filter provided by webpack
            const async = !chunk.canBeInitial();
            // We exclude the crypto-worker and recovery-kit to be split, because we want them all in one file
            return chunk.name !== 'recovery-kit' && chunk.name !== 'crypto-worker' && async;
        },
    },
});
