const path = require('path');
const glob = require('glob');
const CONFIG = require('./env/conf.build');
const env = require('./env/config');

const makeSRC = (list) => list.map((file) => path.resolve(file));
const TEMPLATES_GLOB = makeSRC(glob.sync('./src/templates/**/*.tpl.html'));
const CSS_GLOB = makeSRC(CONFIG.vendor_files.css);

const BUILD_TARGET = !env.isDistRelease() ? 'build' : 'dist';
// const BUILD_TARGET = 'build';

/**
 * Some plugins are broken -> uglifyJS
 * And don't catch their errors, we need to see them
 * tada !!
 */
process.on('unhandledRejection', (reason, p) => {
    console.log('Position', p);
    console.log('Reason', reason);
});

module.exports = {
    stats: 'minimal',
    devtool: !env.isDistRelease() ? 'cheap-module-eval-source-map' : false, // Done via UglifyJS
    mode: !env.isDistRelease() ? 'development' : 'production',
    watchOptions: {
        ignored: [/node_modules/, 'i18n/*.json', /\*\.(gif|jpeg|jpg|ico|png)/]
    },
    optimization: {
        minimizer: [require('./webpack.tasks/uglify.plugin')],
        splitChunks: {
            cacheGroups: {
                commons: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendor-app',
                    chunks: 'all',
                },
            },
        },
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
        app: ['./src/app/app.js'],
        appLazy: ['./src/app/appLazy.js'],
        html: './src/app.html'
    },
    resolve: {
        unsafeCache: true,
        symlinks: false,
        alias: {
            sass: path.resolve('./src/sass'),
            assets: path.resolve('./src/assets')
        }
    },
    output: {
        path: path.resolve(`./${BUILD_TARGET}`),
        filename: '[name].js'
    },

    module: {
        rules: [
            ...require('./webpack.tasks/js.loader'),
            ...require('./webpack.tasks/css.loader'),
            ...require('./webpack.tasks/templates.loader'),
            ...require('./webpack.tasks/assets.loader')
        ]
    },

    plugins: require('./webpack.tasks/plugins')
};
