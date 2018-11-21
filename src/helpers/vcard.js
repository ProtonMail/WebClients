import _ from 'lodash';

import { CONTACT_MODE } from '../app/constants';
import { normalizeEmail } from './string';
import { BOOL_FIELDS } from './vCardFields';

const ESCAPE_REGEX = /\\|,|;/gi;
const UNESCAPE_REGEX = /\\\\|\\,|\\;/gi;
const UNESCAPE_EXTENDED_REGEX = /\\\\|\\:|\\,|\\;/gi;
const BACKSLASH_SEMICOLON_REGEX = /\\;/gi;
const ANIMALS = '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼';
const SPECIAL_CHARACTER_REGEX = /🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼/gi;

export const getGroup = (emailList, email) => {
    const normalEmail = normalizeEmail(email);
    const prop = _.find(emailList, (prop) => normalizeEmail(prop.valueOf()) === normalEmail);
    if (!prop) {
        return;
    }
    return prop.getGroup();
};

export const groupMatcher = (group) => (prop) => {
    return typeof prop.getGroup() === 'undefined' || prop.getGroup().toLowerCase() === group.toLowerCase();
};

/**
 * Order properties by preference parameter
 * @param {Array} properties
 * @return {Array}
 */
export function orderByPref(properties = []) {
    return _.sortBy(properties, (property) => {
        const { pref = 9999 } = property.getParams() || {};
        return ~~pref;
    });
}

export const uniqGroups = (list) => {
    return _.reduce(
        list,
        (acc, property) => {
            const group = property.getGroup();
            if (acc.indexOf(group) === -1) {
                acc.push(group);
            }
            return acc;
        },
        []
    );
};

/**
 * Unescape an input.
 * If extended is a Boolean === true, we can unescape : too.
 * ex: for a base64
 * @param  {String} value
 * @param  {Boolean} extended
 * @return {String}
 */
export const unescapeValue = (value = '', extended) => {
    // If we do map(unescapeValue) we still want the default unescape
    const reg = extended !== true ? UNESCAPE_REGEX : UNESCAPE_EXTENDED_REGEX;
    return value.replace(reg, (val) => val.substr(1));
};

/**
 * Property Value Escaping
 * COMMA character in a value MUST be escaped with a BACKSLASH character.
 * BACKSLASH characters in values MUST be escaped with a BACKSLASH character.
 * N and ADR comprise multiple fields delimited by a SEMICOLON character. Therefore, a SEMICOLON in a field of such a "compound" property MUST be escaped with a BACKSLASH character.
 * SEMICOLON characters in non-compound properties MAY be escaped
 * See: https://tools.ietf.org/html/rfc6350#section-3.4
 * @param {String} value
 * @return {String}
 */
export const processEscape = (value = '') => value.replace(ESCAPE_REGEX, (val) => `\\${val}`);

export const escapeValue = (value = '') => {
    if (Array.isArray(value)) {
        return value.map(processEscape);
    }
    return processEscape(String(value));
};

/**
 * To avoid problem with the split on ; we need to replace \; first and then re-inject the \;
 * There is no negative lookbehind in JS regex
 * See https://github.com/ProtonMail/Angular/issues/6298
 * @param {String} value
 * @return {String}
 */
export const cleanMultipleValue = (value = '') =>
    value
        .replace(BACKSLASH_SEMICOLON_REGEX, ANIMALS)
        .split(';')
        .map((value) => value.replace(SPECIAL_CHARACTER_REGEX, '\\;'))
        .map(unescapeValue);

/**
 * Clean value to be use by the app (UI)
 * @param {String} value - from the vCard Property
 * @param {String} field - vCard field (lowercase)
 * @return {String}
 */
export const cleanValue = (value, field) => {
    // ADR and N contains several value separeted by semicolon
    if (field === 'adr' || field === 'n' || field === 'categories') {
        return cleanMultipleValue(value);
    }

    if (BOOL_FIELDS.includes(field)) {
        return value.toLowerCase().trim() !== 'false';
    }

    return unescapeValue(value, field === 'key');
};

/**
 * Find all categories inside a list of vCard
 * then we build an map
 *     <UID> => <Categories:String> with a comma as separator
 * @param  {Array}  cards
 * @return {Object}
 */
export const getCategoriesEmail = (cards = []) => {
    const hasCategories = ({ Type, Data }) => Type === CONTACT_MODE.CLEAR_TEXT && Data.includes('CATEGORIES');
    const notEncryptedContent = ({ Type }) => Type !== CONTACT_MODE.ENCRYPTED_AND_SIGNED;

    /**
     * Create a map
     *     <TypeOfvCard> => vCard
     * @param  {Object} card
     * @return {Object}
     */
    const formatCards = (card) => {
        return card.reduce((acc, { Type, Data }) => {
            acc[Type] = new vCard().parse(Data);
            return acc;
        }, {});
    };

    /**
     * Get list of categories inside the field categories of a vCard
     * It can be a string or an array of property.
     * We don't care about duplicates as we use a map later by Name
     * @param  {Object} cat content of field categories
     * @return {String}
     */
    const getCategories = (cat) => {
        if (Array.isArray(cat)) {
            return cat.map((prop) => prop.valueOf()).join(',');
        }
        return cat.valueOf();
    };

    const mapCategoriesReducer = (acc, { [CONTACT_MODE.CLEAR_TEXT]: clearText, [CONTACT_MODE.SIGNED]: signed }) => {
        acc[signed.get('uid').valueOf()] = getCategories(clearText.get('categories'));
        return acc;
    };

    return cards
        .filter(({ Cards }) => Cards.some(hasCategories))
        .map(({ Cards }) => Cards.filter(notEncryptedContent))
        .map(formatCards)
        .reduce(mapCategoriesReducer, Object.create(null));
};
