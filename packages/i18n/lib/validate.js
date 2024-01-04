const fs = require('fs');
const path = require('path');
const gettextParser = require('gettext-parser');

const { success, debug } = require('./helpers/log')('proton-i18n');
const { TEMPLATE_FILE } = require('../config');
const { scriptNode } = require('./helpers/cli');

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
    const translationsWithoutContext = getNoContextsExcept(translations, 'Plural-Forms');

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

function validateContextAndVariables(translations) {
    const getDuplicates = (translationsInContext) => {
        const map = {};
        Object.entries(translationsInContext).forEach(([key, value]) => {
            const variables = getVariables(key);
            if (variables) {
                const replacedString = variables.reduce((acc, value, i) => {
                    return acc.replace(value, `\${${i}}`);
                }, key);
                if (!map[replacedString]) {
                    map[replacedString] = [];
                }
                map[replacedString].push(value);
            }
        });
        return Object.fromEntries(Object.entries(map).filter(([, value]) => value.length > 1));
    };

    const result = Object.keys(translations)
        .map((contextKey) => {
            const translationsInContext = translations[contextKey];
            return getDuplicates(translationsInContext);
        })
        .filter((x) => Object.keys(x).length >= 1);

    const total = result.reduce((acc, cur) => acc + Object.values(cur).length, 0);
    if (!total) {
        !isLint && success('All translations have unique variables in their context');
        return;
    }

    !isLint &&
        console.log(
            result
                .map((x) => JSON.stringify(x, null, 2))
                .sort()
                .join('\n')
        );
    throw new Error(`${total} ${total > 1 ? 'translations' : 'translation'} with duplicate variables in same context!`);
}

function validateVariables(translations) {
    const translationsWithoutMatching = getWithoutMatchingVariables(translations);

    const total = translationsWithoutMatching.length;
    if (!total) {
        !isLint && success('All translations have matching variables');
        return;
    }

    !isLint && console.log(translationsWithoutMatching.sort().join('\n'));
    throw new Error(`${total} ${total > 1 ? 'translations' : 'translation'} without matching variables !`);
}

async function main(mode, { dir, flags = {} } = {}) {
    /*
     * Validate the code to check if we use the correct format when we write ttag translations.
     */
    if (mode === 'lint-functions') {
        debug(`[lint-functions] validation path: ${dir}`);
        return scriptNode('linter.mjs', [dir || process.cwd(), flags.isVerbose ? '--verbose' : ''], 'inherit');
    }

    const doc = fs.readFileSync(path.resolve(process.cwd(), TEMPLATE_FILE));
    const { translations } = gettextParser.po.parse(doc);
    validateWithoutContext(translations);
    validateVariables(translations);
    validateContextAndVariables(translations);
}

module.exports = main;
