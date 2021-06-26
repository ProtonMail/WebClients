const webpack = require('webpack');
const ProgressBarPlugin = require('progress-bar-webpack-plugin');
const { success, error } = require('./helpers/log');

function main(config) {
    const compiler = webpack(config);

    new ProgressBarPlugin({
        format: '  build [:bar] :percent (:elapsed seconds)',
        clear: false,
        width: 60
    }).apply(compiler);

    compiler.run((err, stats) => {
        if (err) {
            error(err);
        }

        success(
            stats.toString({
                chunks: false,
                colors: true
            })
        );
    });

    return compiler;
}

module.exports = main;
