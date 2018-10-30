import _ from 'lodash';

export const normalizeEmail = (email = '') => email.toLowerCase();

/**
 * Remove plus alias part present in the email value
 * @param {String} email containing +plus-alias
 */
export const removeEmailAlias = (email = '') => {
    return normalizeEmail(email)
        .replace(/(\+[^@]*)@/, '@')
        .replace(/[._-](?=[^@]*@)/g, '');
};

/**
 * Add plus alias part for an email
 * @param {String} email original
 * @param {String} plus part to add between + and @
 * @return {String}
 */
export const addPlusAlias = (email = '', plus = '') => {
    const atIndex = email.indexOf('@');
    const plusIndex = email.indexOf('+');

    if (atIndex === -1) {
        return email;
    }

    if (plusIndex > -1) {
        return email;
    }

    if (!plus) {
        return email;
    }

    const name = email.substring(0, atIndex);
    const domain = email.substring(atIndex, email.length);

    return `${name}+${plus}${domain}`;
};

/**
 * Converts the integer to a 32-bit base encoded string in 2s complement format, so that it doesn't contain a sign "-"
 * @param val int The integer to be encoded
 * @param bits int The amount of bits per character
 */
export const toUnsignedString = (val, bits) => {
    const base = 1 << bits;
    const wordCount = Math.ceil(32 / bits);
    const bottomBits = (wordCount - 1) * bits;

    const bottom = val & ((1 << bottomBits) - 1);
    const top = val >>> bottomBits;
    if (top === 0) {
        return bottom.toString(base);
    }
    const topString = top.toString(base);
    const bottomString = bottom.toString(base);
    const padLength = wordCount - topString.length - bottomString.length;
    const middleString = '0'.repeat(padLength);
    return topString + middleString + bottomString;
};

/**
 * Unescape a string in hex or octal encoding.
 * See https://www.w3.org/International/questions/qa-escapes#css_other for all possible cases.
 * @param {String} str
 * @returns {String} escaped string
 */
export const unescapeCSSEncoding = (str) => {
    // Regexp declared inside the function to reset its state (because of the global flag).
    // cf https://stackoverflow.com/questions/1520800/why-does-a-regexp-with-global-flag-give-wrong-results
    const UNESCAPE_CSS_ESCAPES_REGEX = /\\([0-9A-Fa-f]{1,6}) ?/g;
    const UNESCAPE_HTML_DEC_REGEX = /&#(\d+)(;|(?=[^\d;]))/g;
    const UNESCAPE_HTML_HEX_REGEX = /&#x([0-9A-Fa-f]+)(;|(?=[^\d;]))/g;
    const OTHER_ESC = /\\(.)/g;

    const handleEscape = (radix) => (ignored, val) => String.fromCodePoint(Number.parseInt(val, radix));
    /*
     * basic unescaped named sequences: &amp; etcetera, lodash does not support a lot, but that is not a problem for our case.
     * Actually handling all escaped sequences would mean keeping track of a very large and ever growing amount of named sequences
     */
    const namedUnescaped = _.unescape(str);
    // lodash doesn't unescape &#160; or &#xA0; sequences, we have to do this manually:
    const decUnescaped = namedUnescaped.replace(UNESCAPE_HTML_DEC_REGEX, handleEscape(10));
    const hexUnescaped = decUnescaped.replace(UNESCAPE_HTML_HEX_REGEX, handleEscape(16));
    // unescape css backslash sequences
    const strUnescapedHex = hexUnescaped.replace(UNESCAPE_CSS_ESCAPES_REGEX, handleEscape(16));

    return strUnescapedHex.replace(OTHER_ESC, (_, char) => char);
};

export const ucFirst = (input = '') => {
    return input.charAt(0).toUpperCase() + input.slice(1);
};
