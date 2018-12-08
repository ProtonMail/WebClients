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

module.exports = {
    splitChunks: {
        cacheGroups: {
            vendor: {
                test: /\/node_modules\/.+(mjs|js|json)$/,
                chunks: 'initial',
                name: 'vendorApp',
                enforce: true
            }
        }
    },
    minimizer
};
