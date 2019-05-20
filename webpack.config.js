const path = require('path');
const env = require('./env/config');
const BUILD_TARGET = !env.isDistRelease() ? 'build' : 'dist';

/**
 * Some plugins are broken -> uglifyJS
 * And don't catch their errors, we need to see them
 * tada !!
 */
process.on('unhandledRejection', (reason, p) => {
    console.log('Position', p);
    console.log('Reason', reason);
});

const isEnvProduction = env.isDistRelease();

module.exports = {
    stats: 'minimal',
    devtool: !isEnvProduction ? 'cheap-module-eval-source-map' : false, // Done via UglifyJS
    mode: !isEnvProduction ? 'development' : 'production',
    watchOptions: {
        ignored: [/node_modules/, 'i18n/*.json', /\*\.(gif|jpeg|jpg|ico|png)/]
    },
    devServer: {
        hot: true,
        stats: 'minimal',
        host: '0.0.0.0',
        port: process.env.NODE_ENV_PORT,
        public: 'localhost',
        historyApiFallback: true,
        disableHostCheck: true,
        contentBase: path.resolve('./build')
    },
    entry: {
        index: ['./src/app/index.js']
    },
    resolve: {
        unsafeCache: true,
        symlinks: false,
        alias: {
            sass: path.resolve('./src/sass'),
            assets: path.resolve('./src/assets'),
            // Custom alias as we're building for the web (mimemessage)
            iconv: 'iconv-lite',
            // Ensure the same pmcrypto is used for pm-srp and angular if you symlink pm-srp to dev.
            pmcrypto: path.resolve('./node_modules/pmcrypto')
        }
    },
    output: {
        path: path.resolve(`./${BUILD_TARGET}`),
        filename: isEnvProduction ? '[name].[chunkhash:10].js' : '[name].js',
        chunkFilename: isEnvProduction ? '[name].[chunkhash:10].chunk.js' : '[name].chunk.js',
        crossOriginLoading: 'anonymous'
    },

    module: {
        rules: [
            ...require('./webpack.tasks/js.loader'),
            ...require('./webpack.tasks/css.loader'),
            ...require('./webpack.tasks/templates.loader'),
            ...require('./webpack.tasks/assets.loader')
        ]
    },

    plugins: require('./webpack.tasks/plugins'),
    optimization: require('./webpack.tasks/optimization')
};
