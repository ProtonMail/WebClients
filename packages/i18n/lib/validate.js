const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const { success, debug } = require('./helpers/log')('proton-i18n');
const { getFiles, isWebClientLegacy } = require('../config');
const { script } = require('./helpers/cli');

const { TEMPLATE_FILE } = getFiles();
const isLint = process.argv.includes('--lint');

/**
 * Parse pot file and find translations without a context
 * @param  {Buffer} Raw text input
 */
function findNoContext(doc) {
    if (isWebClientLegacy()) {
        return _.filter(doc.toString().split(/^\s*\n/gm), (str) => {
            return !str.includes('msgctxt') && !str.includes('Project-Id-Version');
        });
    }

    return _.filter(doc.toString().split(/^\s*\n/gm), (str) => {
        const noCtx = !str.includes('msgctxt') && !str.includes('Plural-Forms');
        const emptyCyx = str.includes('msgctxt') && str.includes('msgctxt ""');
        return noCtx || emptyCyx;
    });
}

function main(mode, { dir } = {}) {
    /*
     * Validate the code to check if we use the correct format when we write ttag translations.
     */
    if (mode === 'lint-functions') {
        debug(`[lint-functions] validtion path: ${dir}`);
        return script('lint.sh', [dir]);
    }

    const doc = fs.readFileSync(path.resolve(process.cwd(), TEMPLATE_FILE));
    const translations = findNoContext(doc);
    const total = translations.length;
    const word = total > 1 ? 'translations' : 'translation';

    if (!isLint && !total) {
        success('All translations have a context, good job !');
    }

    if (isLint && total) {
        throw new Error(`${total} ${word} without context !`);
    }

    if (!isLint && total) {
        console.log(translations.sort().join('\n'));
        throw new Error(`${total} ${word} without context !`);
    }
}

module.exports = main;
