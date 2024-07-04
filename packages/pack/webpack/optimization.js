const TerserPlugin = require('terser-webpack-plugin');
const { EsbuildPlugin } = require('esbuild-loader');

let parallel = undefined;
if (typeof process.env.WEBPACK_PARALLELISM !== 'undefined') {
    parallel = parseInt(process.env.WEBPACK_PARALLELISM, 10);
}

const EXCLUDED_CHUNKS = ['recovery-kit', 'crypto-worker', 'drive-worker'];

module.exports = /** @type { (env: any) => import('webpack').Options.Optimization } */ ({ isProduction }) => ({
    // Needs to be single because we embed two entry points
    runtimeChunk: 'single',
    minimize: isProduction,
    minimizer: [
        new TerserPlugin({
            parallel,
            minify: TerserPlugin.swcMinify,
            extractComments: false,
        }),
        new EsbuildPlugin({
            css: true,
        }),
    ],
    splitChunks: {
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        chunks(chunk) {
            return !chunk.canBeInitial() && !EXCLUDED_CHUNKS.includes(chunk.name);
        },
    },
});
