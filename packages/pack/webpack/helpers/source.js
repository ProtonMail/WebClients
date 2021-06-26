const path = require('path');
const fs = require('fs');

const ROOT_DIR = process.cwd();
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

const getSource = (input) => path.join(ROOT_DIR, input);

const firstExisting = (sourceFiles) => {
    const file = sourceFiles.map(getSource).find((path) => fs.existsSync(path));
    if (!file) {
        throw new Error('One of these mandatory entry files must exist: ' + JSON.stringify(sourceFiles));
    }

    return file;
};

module.exports = {
    getPort,
    findPort,
    getSource,
    getPublicPath,
    firstExisting
};
