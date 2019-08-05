import getRandomValues from 'get-random-values';

const CURRENCIES = {
    USD: '$',
    EUR: '€',
    CHF: 'CHF'
};

export const getRandomString = (length) => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let i;
    let result = '';

    const values = getRandomValues(new Uint32Array(length));

    for (i = 0; i < length; i++) {
        result += charset[values[i] % charset.length];
    }

    return result;
};

export const normalize = (value = '') => value.toLowerCase().trim();

export const replaceLineBreak = (content = '') => content.replace(/(?:\r\n|\r|\n)/g, '<br />');

export const toPrice = (amount = 0, currency = 'EUR', divisor = 100) => {
    const symbol = CURRENCIES[currency] || currency;
    const value = Number(amount / divisor).toFixed(2);
    const prefix = value < 0 ? '-' : '';
    const absValue = Math.abs(value);

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
 * @param {String} str
 */
export const capitalize = (str) => {
    if (str === '' || typeof str !== 'string') {
        return '';
    }
    return str[0].toUpperCase() + str.slice(1);
};

/**
 * Extract 2 first initials
 * @param {String} value
 * @retuns {String}
 */
export const getInitial = (value = '') => {
    const [first, second] = value.split(' ');
    return [first, second]
        .filter(Boolean)
        .map((letter = '') => [...letter.toUpperCase()][0]) // We use the spread operator to support Unicode characters
        .join('');
};

/**
 * NOTE: These functions exist in openpgp, but in order to load the application
 * without having to load openpgpjs they are added here.
 * @param {Uint8Array} bytes
 * @return {string}
 */
export const arrayToBinaryString = (bytes) => {
    const buffer = new Uint8Array(bytes);
    const bs = 1 << 14;
    const j = bytes.length;
    const result = [];
    for (let i = 0; i < j; i += bs) {
        // eslint-disable-next-line prefer-spread
        result.push(String.fromCharCode.apply(String, buffer.subarray(i, i + bs < j ? i + bs : j)));
    }
    return result.join('');
};

/**
 * @param {String} str
 * @return {Uint8Array}
 */
export const binaryStringToArray = (str) => {
    const result = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        result[i] = str.charCodeAt(i);
    }
    return result;
};
