const fs = require('fs');
const path = require('path');
const _ = require('lodash');

const isDebug = process.argv.includes('--debug');

function main() {
    const doc = fs.readFileSync(path.resolve('./i18n/templates.pot'));
    const translations = _.filter(doc.toString().split(/^\s*\n/gm), (str) => {
        const noCtx = (!str.includes('msgctxt') && !str.includes('Plural-Forms'))
        const emptyCyx = str.includes('msgctxt') && str.includes('msgctxt ""');
        return noCtx || emptyCyx;
    });
    const total = translations.length;
    const verb = (total > 1) ? 'are' : 'is';

    if (!isDebug && total) {
        throw new Error(`There ${verb} ${total} translation(s) without context !`);
    }

    if (isDebug && total) {
        console.log(translations.sort().join('\n'));
        throw new Error(`There ${verb} ${total} translation(s) without context !`);
    }
}

module.exports = main;