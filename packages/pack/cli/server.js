const WebpackDevServer = require('webpack-dev-server');
const webpack = require('webpack');

function main(config) {
    const compiler = webpack(config);
    const server = new WebpackDevServer(compiler, config.devServer);
    return server;
}

module.exports = main;
