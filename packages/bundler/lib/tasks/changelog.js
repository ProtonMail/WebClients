const coucou = require('../helpers/coucou');
const { getPackage } = require('../config');
const { generateChangelog } = require('../git');
const { debug, warn } = require('../helpers/log')('proton-bundler');

function main(argv) {
    const PKG = getPackage();
    const { branch, mode, api } = argv;
    const url = argv.url || (PKG.bugs || {}).url;
    const isV4 = mode === 'v4';
    debug({ argv }, 'arguments');

    if (!['dev', 'v4', process.env.QA_BRANCH].includes(branch) && !isV4) {
        return warn(`No changelog available for the branch ${branch}`); // not available
    }

    if (!url && !isV4) {
        return warn('No URL found for the issues');
    }

    return generateChangelog(branch, url, isV4).then((data) => {
        const env = isV4 ? 'https://v4.protonmail.blue' : branch;
        if (data) {
            coucou.send(data, { env, mode: 'changelog', api }, PKG);
        }
    });
}

module.exports = main;
