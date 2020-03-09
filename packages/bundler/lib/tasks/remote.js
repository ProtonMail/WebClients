const { getPackage } = require('../config');
const { script } = require('../helpers/cli');
const buildRemote = require('../buildRemote');

async function main() {
    const PKG = getPackage();
    /*
        If we build from the remote repository we need to:
            - clone the repository inside /tmp
            - install dependencies
            - run the deploy command again from this directory
        So let's put an end to the current deploy.
     */
    await buildRemote(PKG);
    const args = process.argv.slice(2).filter((key) => !/--remote/.test(key));
    return script('builder.sh', [PKG.name, ...args], 'inherit'); // inherit for the colors ;)
}

module.exports = main;
