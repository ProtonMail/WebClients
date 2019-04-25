const fs = require('fs');
const path = require('path');
const execa = require('execa');
const _ = require('lodash');

const { success, spin, debug } = require('./helpers/log')('proton-i18n');

const isLint = process.argv.includes('--lint');

function findNoContext(doc) {
    if (process.env.APP_KEY === 'Angular') {
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

/**
 * Validate the code to check if we use the correct format when
 * we write ttag translations.
 * @param  {String} arg path to lint
 */
async function validateFunctionFormat(arg = '') {
    const cmd = path.resolve(__dirname, '..', 'scripts/lint.sh');
    try {
        await execa.shell(`${cmd} ${arg}`, {
            shell: '/bin/bash'
        });
    } catch (e) {
        console.log(e.message);
        process.exit(1);
    }
}

function main(mode, { dir } = {}) {
    if (mode === 'lint-functions') {
        debug(`[lint-functions] validtion path:${dir}`);
        return validateFunctionFormat(dir);
    }

    const spinner = spin('Parsing translations');
    const doc = fs.readFileSync(path.resolve('./po/template.pot'));
    const translations = findNoContext(doc);
    const total = translations.length;
    const word = total > 1 ? 'translations' : 'translation';
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
