import _ from 'lodash';

import { normalizeEmail } from './string';
import { BOOL_FIELDS } from './vCardFields';

const ESCAPE_REGEX = /:|,|;/gi;
const UNESCAPE_REGEX = /\\:|\\,|\\;/gi;
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
        const { pref = 0 } = property.getParams() || {};
        return pref;
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

export const unescapeValue = (value = '') => value.replace(UNESCAPE_REGEX, (val) => val.substr(1));
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
    if (field === 'adr' || field === 'n') {
        return cleanMultipleValue(value);
    }

    if (BOOL_FIELDS.includes(field)) {
        return value.toLowerCase().trim() !== 'false';
    }

    return unescapeValue(value);
};
