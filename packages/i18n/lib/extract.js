const path = require('path');

const { TEMPLATE_FILE } = require('../config');
const { success, debug } = require('./helpers/log')('proton-i18n');
const { hasDirectory } = require('./helpers/file');
const { script, bash } = require('./helpers/cli');

// npx and dlx resolve from the registry instead of the version we have installed,
// so we point to the binary of the local ttag-cli
const TTAG_BIN = path.resolve(
    path.dirname(require.resolve('ttag-cli/package.json')),
    require('ttag-cli/package.json').bin.ttag
);

const PATHS = {
    reactComponents: ['{components,containers,helpers,hooks}'],
    shared: ['lib'],
};

async function extractor(app = 'app') {
    debug(app, 'type of extraction');

    if (app !== 'app') {
        const dest = PATHS[app].join(' ');
        if (!dest) {
            throw new Error('Unknown app target');
        }
        const cmd = `"${TTAG_BIN}" extract $(find ${dest} -type f -name '*.js' -o -name '*.ts' -o -name '*.tsx' -o -name '*.jsx') -o ${TEMPLATE_FILE}`;
        debug(cmd);
        return bash(cmd);
    }

    return script('extract.sh', [TEMPLATE_FILE], 'inherit');
}

async function main(app) {
    await hasDirectory(TEMPLATE_FILE);
    const { stdout } = await extractor(app);
    debug(stdout);
    success(`Translations extracted to ${TEMPLATE_FILE}`);
}

module.exports = main;
