const { getFiles, isWebClientLegacy } = require('../config');
const { success, debug } = require('./helpers/log')('proton-i18n');
const { hasDirectory } = require('./helpers/file');
const { script, bash } = require('./helpers/cli');

const { TEMPLATE_FILE } = getFiles();

const PATHS = {
    reactComponents: ['{components,containers,helpers,hooks}'],
    shared: ['lib'],
};

async function extractor(app = 'app') {
    debug(app, 'type of extraction');

    if (isWebClientLegacy()) {
        const cmd = `npx angular-gettext-cli --files './src/+(app|templates)/**/**/*.+(js|html)' --dest ${TEMPLATE_FILE} --attributes "placeholder-translate","title-translate","pt-tooltip-translate","translate"`;
        debug(cmd);
        return bash(cmd);
    }

    if (app !== 'app') {
        const dest = PATHS[app].join(' ');
        if (!dest) {
            throw new Error('Unknown app target');
        }
        const cmd = `yarn dlx -p ttag-cli ttag extract $(find ${dest} -type f -name '*.js' -o -name '*.ts' -o -name '*.tsx' -o -name '*.jsx') -o ${TEMPLATE_FILE}`;
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
