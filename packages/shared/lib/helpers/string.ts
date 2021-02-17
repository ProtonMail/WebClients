import getRandomValues from 'get-random-values';

enum CURRENCIES {
    USD = '$',
    EUR = '€',
    CHF = 'CHF',
}

export const getRandomString = (
    length: number,
    charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
) => {
    let i;
    let result = '';

    const values = getRandomValues(new Uint32Array(length));

    for (i = 0; i < length; i++) {
        result += charset[values[i] % charset.length];
    }

    return result;
};

export const normalize = (value = '', removeDiacritics = false) => {
    let normalized = value.toLowerCase().trim();
    if (removeDiacritics) {
        normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    return normalized;
};

export const replaceLineBreak = (content = '') => content.replace(/(?:\r\n|\r|\n)/g, '<br />');

export const toPrice = (amount = 0, currency: keyof typeof CURRENCIES = 'EUR', divisor = 100) => {
    const symbol = CURRENCIES[currency] || currency;
    const value = Number(amount / divisor).toFixed(2);
    const prefix = +value < 0 ? '-' : '';
    const absValue = Math.abs(+value);

    if (currency === 'USD') {
        return `${prefix}${symbol}${absValue}`;
    }

    return `${prefix}${absValue} ${symbol}`;
};

export const addPlus = ([first = '', ...rest] = []) => {
    return [first, rest.length && `+${rest.length}`].filter(Boolean).join(', ');
};

/**
 * Capitalize a string
 */
export const capitalize = (str: any) => {
    if (str === '' || typeof str !== 'string') {
        return '';
    }
    return str[0].toUpperCase() + str.slice(1);
};

/**
 * Uncapitalize a string
 */
export const uncapitalize = (str: any) => {
    if (str === '' || typeof str !== 'string') {
        return '';
    }
    return str[0].toLowerCase() + str.slice(1);
};

/**
 * Given a maximum number of characters to display,
 * truncate a string by adding omission if too long
 */
export const truncate = (str = '', charsToDisplay = 50, omission = '…') => {
    if (str.length === 0) {
        return str;
    }
    if (str.length > charsToDisplay) {
        return str.substring(0, charsToDisplay - omission.length) + omission;
    }
    return str;
};

/**
 * Given a maximum number of characters to capture from a string at the start and end of it,
 * truncate the string by adding omission if too long
 */
export const truncateMore = ({ string = '', charsToDisplayStart = 0, charsToDisplayEnd = 0, omission = '…' }) => {
    if (string.length === 0) {
        return string;
    }
    if (string.length <= charsToDisplayStart + charsToDisplayEnd + omission.length) {
        return string;
    }
    const strBegin = string.substring(0, charsToDisplayStart);
    const strEnd = string.substring(string.length - charsToDisplayEnd, string.length);
    return strBegin + omission + strEnd;
};

export const getInitials = (fullName = '') => {
    const [first = '', ...rest] = fullName
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '') // Remove specific punctuation
        .replace(/\s{2,}/g, ' ')
        .split(' ');
    const last = rest[rest.length - 1];

    return [first, last]
        .filter(Boolean)
        .map((letter = '') => [...letter.toUpperCase()][0]) // We use the spread operator to support Unicode characters
        .join('');
};

export const hasProtonDomain = (email = '') => {
    const protonmailRegex = /@(protonmail\.(com|ch)|pm\.me|)$/i;
    return protonmailRegex.test(email);
};

const getMatchingCharacters = (string: string, substring: string) => {
    let i;
    for (i = 0; i < substring.length; ++i) {
        if (string[i] !== substring[i]) {
            return i;
        }
    }
    return i > 0 ? i : 0;
};

export const findLongestMatchingIndex = (strings: string[] = [], substring = '') => {
    let max = 0;
    let i = -1;

    strings.forEach((string, idx) => {
        const numberOfMatches = getMatchingCharacters(string, substring);
        if (numberOfMatches > max) {
            max = numberOfMatches;
            i = idx;
        }
    });

    return i;
};

export const stripLeadingAndTrailingSlash = (str: string) => str.replace(/^\/+|\/+$/g, '');

export const removeDiacritics = (str: string) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
};
