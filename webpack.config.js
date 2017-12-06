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
 * And don't catch their Error, we need to see them
 * tada !!
 */
process.on('unhandledRejection', (reason, p) => {
    console.log('Position', p);
    console.log('Reason', reason);
});

module.exports = {
    stats: 'minimal',
    devtool: !env.isDistRelease() ? 'eval-source-map' : false, // Done via UglifyJS
    devServer: {
        hot: true,
        stats: 'minimal',
        historyApiFallback: true,
        contentBase: path.resolve('./build'),
        publicPath: '/',
        filename: 'app.js'
    },
    entry: {
        templates: TEMPLATES_GLOB,
        app: ['./src/app/app.js', './src/sass/app.scss'],
        styles: CSS_GLOB.concat(['./src/sass/app.scss']),
        html: './src/app.html'
    },
    resolve: {
        alias: {
            sass: path.resolve('./src/sass'),
            assets: path.resolve('./src/assets')
        }
    },
    output: {
        path: path.resolve(`./${BUILD_TARGET}`),
        filename: env.isDistRelease() ? '[name].[chunkhash].js' : '[name].[hash].js'
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
