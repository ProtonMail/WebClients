const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const { success, spin } = require('./helpers/log')('proton-i18n');
const isLint = process.argv.includes('--lint');

function main() {
    const spinner = spin('Parsing translations');
    const doc = fs.readFileSync(path.resolve('./i18n/templates.pot'));
    const translations = _.filter(doc.toString().split(/^\s*\n/gm), (str) => {
        const noCtx = (!str.includes('msgctxt') && !str.includes('Plural-Forms'))
        const emptyCyx = str.includes('msgctxt') && str.includes('msgctxt ""');
        return noCtx || emptyCyx;
    });
    const total = translations.length;
    const word = (total > 1) ? 'translations' : 'translation';
    spinner.stop();

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