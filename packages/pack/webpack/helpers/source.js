const fs = require('fs');

const portfinder = require('portfinder'); // Coming from webpack-dev-server

const getPort = ({ port }) => port || process.env.NODE_ENV_PORT || 8080;

const findPort = async (basePort) => {
    // Default PORT for webpack
    portfinder.basePort = basePort;
    const port = await portfinder.getPortPromise();
    process.env.NODE_ENV_PORT = port;
    return port;
};

const getPublicPath = ({ publicPath }) => publicPath || process.env.PUBLIC_PATH || '/';

const firstExisting = (sourceFiles) => {
    const file = sourceFiles.find((path) => fs.existsSync(path));
    if (!file) {
        throw new Error('One of these mandatory entry files must exist: ' + JSON.stringify(sourceFiles));
    }
    return file;
};

module.exports = {
    getPort,
    findPort,
    getPublicPath,
    firstExisting
};
