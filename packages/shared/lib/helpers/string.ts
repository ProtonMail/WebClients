import getRandomValues from 'get-random-values';
import { decodeBase64, encodeBase64 } from 'pmcrypto';

enum CURRENCIES {
    USD = '$',
    EUR = '€',
    CHF = 'CHF'
}

export const getRandomString = (length: number) => {
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
export const capitalize = (str: string) => {
    if (str === '' || typeof str !== 'string') {
        return '';
    }
    return str[0].toUpperCase() + str.slice(1);
};

/**
 * Given a maximum number of characters to display,
 * truncate a string by adding omission if too long
 */
export const truncate = (str = '', charsToDisplay = 50, omission = '...') => {
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
export const truncateMore = ({ string = '', charsToDisplayStart = 0, charsToDisplayEnd = 0, omission = '...' }) => {
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

/**
 * Extract 2 first initials
 */
export const getInitial = (value = '') => {
    const [first = '', second = ''] = value
        .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '') // Remove specific punctuation
        .replace(/\s{2,}/g, ' ') // Remove any extra spaces
        .split(' ');
    return [first, second]
        .filter(Boolean)
        .map((letter = '') => [...letter.toUpperCase()][0]) // We use the spread operator to support Unicode characters
        .join('');
};

/**
 * NOTE: These functions exist in openpgp, but in order to load the application
 * without having to load openpgpjs they are added here.
 */
export const arrayToBinaryString = (bytes: Uint8Array): string => {
    const buffer = new Uint8Array(bytes);
    const bs = 1 << 14;
    const j = bytes.length;
    const result = [];
    for (let i = 0; i < j; i += bs) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        // eslint-disable-next-line prefer-spread
        result.push(String.fromCharCode.apply(String, buffer.subarray(i, i + bs < j ? i + bs : j)));
    }
    return result.join('');
};

/**
 * @param {String} str
 * @return {Uint8Array}
 */
export const binaryStringToArray = (str: string) => {
    const result = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        result[i] = str.charCodeAt(i);
    }
    return result;
};

/**
 * Encode a binary string in the so-called base64 URL (https://tools.ietf.org/html/rfc4648#section-5)
 * @dev Each character in a binary string can only be one of the characters in a reduced 255 ASCII alphabet. I.e. morally each character is one byte
 * @dev This function will fail if the argument contains characters which are not in this alphabet
 * @dev This encoding works by converting groups of three "bytes" into groups of four base64 characters (2 ** 6 ** 4 is also three bytes)
 * @dev Therefore, if the argument string has a length not divisible by three, the returned string will be padded with one or two '=' characters
 * @dev WE REMOVE THE PADDING CHARACTERS
 */
export const encodeBase64URL = (str: string) => {
    return encodeBase64(str)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};

/**
 * Convert a string encoded in base64 URL into a binary string
 * @param str
 */
export const decodeBase64URL = (str: string) => {
    return decodeBase64((str + '==='.slice((str.length + 3) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
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

/**
 * Validate the local part of an email string according to the RFC https://tools.ietf.org/html/rfc5322;
 * see also https://en.wikipedia.org/wiki/Email_address#Local-part
 */
export const validateLocalPart = (localPart: string) => {
    const match = localPart.match(/(^\(.+?\))?([^()]*)(\(.+?\)$)?/);
    if (!match) {
        return false;
    }
    const uncommentedPart = match[2];
    if (/".+"/.test(uncommentedPart)) {
        return true;
    }
    return !/[^a-zA-Z0-9!#$%&'*+-/=?^_`{|}~]|^\.|\.$|\.\./.test(uncommentedPart);
};

/**
 * Validate the domain of an email string according to the RFC https://tools.ietf.org/html/rfc5322;
 * see also https://en.wikipedia.org/wiki/Email_address#Domain
 */
export const validateDomain = (domain: string) => {
    if (/\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\]/.test(domain)) {
        return true;
    }
    const dnsLabels = domain.split('.');
    if (dnsLabels.length < 2) {
        return false;
    }
    const topLevelDomain = dnsLabels.pop() as string;
    if (!/[a-zA-Z]{2,}/.test(topLevelDomain)) {
        return false;
    }
    return !dnsLabels.some((label) => {
        return /[^a-zA-Z0-9-]|^-|-$/.test(label);
    });
};

/**
 * Split an email into local part plus domain.
 */
const getEmailParts = (email: string): string[] => {
    const endIdx = email.lastIndexOf('@');
    if (endIdx === -1) {
        return [email, ''];
    }
    return [email.slice(0, endIdx), email.slice(endIdx + 1)];
};

/**
 * Validate an email string according to the RFC https://tools.ietf.org/html/rfc5322;
 * see also https://en.wikipedia.org/wiki/Email_address
 */
export const validateEmailAddress = (email: string) => {
    const [localPart, domain] = getEmailParts(email);
    return validateLocalPart(localPart) && validateDomain(domain);
};

/**
 * Normalize an internal email. This is needed to compare when two internal emails should be considered equivalent
 * See documentation at https://confluence.protontech.ch/display/MAILFE/Email+normalization
 */
export const normalizeInternalEmail = (email: string) => {
    const [localPart, domain] = getEmailParts(email);
    const normalizedLocalPart = localPart.replace(/[._-]/g, '').toLowerCase();
    return `${normalizedLocalPart}@${domain}`;
};

/**
 * Normalize an external email. This is needed to compare when two external emails should be considered equivalent.
 * Basically we just check email validity
 * See documentation at https://confluence.protontech.ch/display/MAILFE/Email+normalization for more information
 */
export const normalizeExternalEmail = (email: string) => {
    const [localPart, domain] = getEmailParts(email);
    return `${localPart}@${domain}`;
};

/**
 * Normalize an email. This is needed to compare when two emails should be considered equivalent
 * See documentation at https://confluence.protontech.ch/display/MAILFE/Email+normalization
 */
export const normalizeEmail = (email: string, isInternal?: boolean) => {
    return isInternal ? normalizeInternalEmail(email) : normalizeExternalEmail(email);
};
