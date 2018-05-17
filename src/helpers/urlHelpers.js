import { LINK_TYPES } from '../app/constants';

const PREFIX_TO_TYPE = {
    'tel:': LINK_TYPES.PHONE,
    'mailto:': LINK_TYPES.EMAIL,
    'http://': LINK_TYPES.WEB,
    'https://': LINK_TYPES.WEB
};

const TYPE_TO_PREFIX = {
    [LINK_TYPES.PHONE]: { regex: /^tel:/, defaultPrefix: 'tel:' },
    [LINK_TYPES.EMAIL]: { regex: /^mailto:/, defaultPrefix: 'mailto:' },
    [LINK_TYPES.WEB]: { regex: /^http(|s):\/\//, defaultPrefix: 'https://' }
};

// Create one big regexp of all the regexes in TYPE_TO_PREFIX.
// It can be used for finding a particular type from a link.
const ALL_REGEXP_SOURCES = Object.keys(TYPE_TO_PREFIX)
    .map((key) => `(${TYPE_TO_PREFIX[key].regex.source})`)
    .join('|');
const ALL_REGEXP = new RegExp(ALL_REGEXP_SOURCES);

/**
 * Get the current sorting state from the URL (?sort=asc|desc)
 * @param {String} stateParams
 * @return {Object}
 */
export const currentSorting = (stateParams) => {
    const prefix = (stateParams.sort || '').startsWith('-') ? '-' : '';
    const sort = (stateParams.sort || '').substr(prefix.length);
    const order = prefix === '' ? 'asc' : 'desc';

    return { order, sort };
};

/**
 * Get a link prefix from a url.
 * @param {String} input
 * @returns {String}
 */
const getLinkPrefix = (input = '') => {
    const matches = ALL_REGEXP.exec(input) || [];
    return matches[0];
};

/**
 * Strip the link prefix from a url.
 * Leave the prefix if it's http to let the user be able to set http or https.
 *
 * @param {String} input
 * @returns {String}
 */
export const stripLinkPrefix = (input = '') => {
    const prefix = getLinkPrefix(input);
    if (!prefix || prefix.indexOf('http') !== -1) {
        return input;
    }
    return input.replace(prefix, '');
};

/**
 * Convert from a link prefix to link type.
 * @param {String} prefix
 * @returns {String}
 */
const prefixToType = (prefix = 'http://') => {
    return PREFIX_TO_TYPE[prefix];
};

/**
 * Get a link type from a link.
 * @param link
 * @returns {String}
 */
export const linkToType = (link = '') => {
    const prefix = getLinkPrefix(link);
    return prefixToType(prefix);
};

/**
 * Convert from a link prefix to link type.
 * @param {String} type
 * @returns {Object}
 */
export const typeToPrefix = (type = LINK_TYPES.WEB) => {
    return TYPE_TO_PREFIX[type];
};

/**
 * Format a link to append a mailto, tel or http before it
 * @param {String} input
 * @param {String} type
 * @return {String}
 */
export const formatLink = (input = '', type = LINK_TYPES.WEB) => {
    const link = input.trim();
    const { regex, defaultPrefix } = typeToPrefix(type);
    if (input === '') {
        return '';
    }
    if (regex.test(link)) {
        return link;
    }
    return `${defaultPrefix}${link}`;
};
