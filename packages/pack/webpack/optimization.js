const TerserPlugin = require('terser-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

module.exports = /** @type { (env: any) => import('webpack').Options.Optimization } */ ({ isProduction }) => ({
    // Needs to be single because we embed two entry points
    runtimeChunk: 'single',
    minimize: isProduction,
    minimizer: [
        new TerserPlugin({
            extractComments: false,
        }),
        new CssMinimizerPlugin({
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
    splitChunks: {
        chunks(chunk) {
            // This is the default "async" filter provided by webpack
            const async = !chunk.canBeInitial();
            // We exclude the crypto-worker and recovery-kit to be split, because we want them all in one file
            return chunk.name !== 'recovery-kit' && chunk.name !== 'crypto-worker' && async;
        },
    },
});
