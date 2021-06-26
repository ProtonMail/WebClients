const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');

function main(config) {
    const compiler = webpack(config);
    return new WebpackDevServer(compiler, config.devServer);
}

module.exports = main;
