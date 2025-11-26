const TerserPlugin = require('terser-webpack-plugin');
const { EsbuildPlugin } = require('esbuild-loader');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

let parallel = undefined;
if (typeof process.env.WEBPACK_PARALLELISM !== 'undefined') {
    parallel = parseInt(process.env.WEBPACK_PARALLELISM, 10);
}

const EXCLUDED_CHUNKS = new Set(['web-llm', 'llm-worker', 'recovery-kit', 'crypto-worker', 'drive-worker']);

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
        tz: {
            test: /@protontech\/timezone-support|ical\.js/,
            name: 'timezone-support',
            chunks: 'all',
        },
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
        // We exclude the crypto-worker and recovery-kit to be split, because we want them all in one file
        return !chunk.canBeInitial() && !EXCLUDED_CHUNKS.has(chunk.name);
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
            /** Override `@swc/core`'s default of 2 passes (introduced in v1.10.15).
             * With only 2 passes, dead code elimination is insufficient and can leave
             * problematic code fragments in the bundle (like calls to `null`).
             * Our testing shows 5 passes provides optimal dead code elimination
             * with acceptable performance impact on build times. */
            terserOptions: { compress: { passes: 5 } },
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
