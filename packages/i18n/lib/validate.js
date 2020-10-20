const fs = require('fs');
const path = require('path');
const gettextParser = require('gettext-parser');

const { success, debug } = require('./helpers/log')('proton-i18n');
const { getFiles, isWebClientLegacy } = require('../config');
const { script } = require('./helpers/cli');

const { TEMPLATE_FILE } = getFiles();
const isLint = process.argv.includes('--lint');

/**
 * Parse pot file and find translations without a context
 * @param {object} translations po object
 * @param {string} except
 */
const getNoContextsExcept = (translations, except) => {
    const emptyContexts = translations[''];
    const emptyContextsKeys = Object.keys(emptyContexts);

    return emptyContextsKeys
        .filter((translationKey) => {
            const translation = emptyContexts[translationKey];
            return !(Array.isArray(translation.msgstr) && translation.msgstr.some((str) => str.includes(except)));
        })
        .map((key) => JSON.stringify(emptyContexts[key], null, 2));
};

function validateWithoutContext(translations) {
    const translationsWithoutContext = getNoContextsExcept(
        translations,
        isWebClientLegacy() ? 'Project-Id-Version' : 'Plural-Forms'
    );

    const total = translationsWithoutContext.length;
    if (!total) {
        !isLint && success('All translations have a context, good job !');
        return;
    }

    !isLint && console.log(translationsWithoutContext.sort().join('\n'));
    throw new Error(`${total} ${total > 1 ? 'translations' : 'translation'} without context !`);
}

function getVariables(msgid) {
    const variableREG = /\$\{\s*([.\w+[\]])*\s*\}/g;
    return msgid.match(variableREG) || [];
}

function getWithoutMatchingVariables(translations) {
    return Object.keys(translations)
        .map((contextKey) => {
            const translationsInContext = translations[contextKey];
            return Object.keys(translationsInContext).map((translationKey) => translationsInContext[translationKey]);
        })
        .flat()
        .filter(({ msgid_plural: msgIdPlural, msgid }) => {
            if (!msgIdPlural) {
                return;
            }
            const variablesSingle = getVariables(msgid).sort().join('');
            const variablesPlural = getVariables(msgIdPlural).sort().join('');
            return variablesSingle !== variablesPlural;
        })
        .map((x) => JSON.stringify(x, null, 2));
}

function validateVariables(translations) {
    if (isWebClientLegacy()) {
        return;
    }
    const translationsWithoutMatching = getWithoutMatchingVariables(translations);

    const total = translationsWithoutMatching.length;
    if (!total) {
        !isLint && success('All translations have matching variables');
        return;
    }

    !isLint && console.log(translationsWithoutMatching.sort().join('\n'));
    throw new Error(`${total} ${total > 1 ? 'translations' : 'translation'} without matching variables !`);
}

function main(mode, { dir } = {}) {
    /*
     * Validate the code to check if we use the correct format when we write ttag translations.
     */
    if (mode === 'lint-functions') {
        debug(`[lint-functions] validation path: ${dir}`);
        return script('lint.sh', [dir]);
    }

    const doc = fs.readFileSync(path.resolve(process.cwd(), TEMPLATE_FILE));
    const { translations } = gettextParser.po.parse(doc);
    validateWithoutContext(translations);
    validateVariables(translations);
}

module.exports = main;
