/* not importing @redux-devtools/cli as its breaking the CI installation phase */
/* eslint-disable-next-line import/no-unresolved */
const exec = require('child_process');
const path = require('path');

const npmRoot = exec.execSync('npm root -g').toString();
const reduxDevToolsPath = path.resolve(npmRoot.trim(), '@redux-devtools/cli');
const reduxDevTools = require(reduxDevToolsPath).default;

const createReduxDevTools = async ({ key, cert, port }) => {
    const reduxTools = await reduxDevTools({
        hostname: 'localhost',
        protocol: 'https',
        port,
        key,
        cert,
    });

    await new Promise((resolve) => reduxTools.on('ready', resolve));
};

module.exports = createReduxDevTools;
