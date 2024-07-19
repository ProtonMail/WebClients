const TerserPlugin = require('terser-webpack-plugin');
const { EsbuildPlugin } = require('esbuild-loader');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

let parallel = undefined;
if (typeof process.env.WEBPACK_PARALLELISM !== 'undefined') {
    parallel = parseInt(process.env.WEBPACK_PARALLELISM, 10);
}

const EXCLUDED_CHUNKS = new Set(['recovery-kit', 'crypto-worker', 'drive-worker']);

const fastSplit = {
    minSize: 20000,
    minRemainingSize: 0,
    minChunks: 1,
    maxAsyncRequests: 30,
    maxInitialRequests: 30,
    enforceSizeThreshold: 50000,
    chunks(chunk) {
        return !chunk.canBeInitial() && !EXCLUDED_CHUNKS.has(chunk.name);
    },
    cacheGroups: {
        defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
        },
        default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
        },
    },
};

const slowSplit = {
    chunks(chunk) {
        const async = !chunk.canBeInitial();
        // We exclude the crypto-worker and recovery-kit to be split, because we want them all in one file
        return (
            chunk.name !== 'recovery-kit' && chunk.name !== 'crypto-worker' && chunk.name !== 'drive-worker' && async
        );
    },
};

module.exports = /** @type { (env: any) => import('webpack').Options.Optimization } */ ({
    isProduction,
    webpackOnCaffeine,
}) => ({
    // Needs to be single because we embed two entry points
    runtimeChunk: 'single',
    minimize: isProduction,
    minimizer: [
        new TerserPlugin({
            parallel,
            minify: TerserPlugin.swcMinify,
            extractComments: false,
        }),
        webpackOnCaffeine
            ? new EsbuildPlugin({
                  css: true,
              })
            : new CssMinimizerPlugin({
                  parallel,
                  minimizerOptions: {
                      preset: [
                          'default',
                          {
                              calc: false,
                          },
                      ],
                  },
              }),
    ],
    splitChunks: webpackOnCaffeine ? fastSplit : slowSplit,
});
