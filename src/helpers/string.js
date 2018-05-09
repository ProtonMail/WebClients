export const normalizeEmail = (email) => email.toLowerCase();

export const removeEmailAlias = (email = '') => {
    return normalizeEmail(email)
        .replace(/(\+[^@]*)@/, '@')
        .replace(/[._-](?=[^@]*@)/g, '');
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
 * Unescape a string in hex or octal encoding. Taken from https://github.com/mathiasbynens/cssesc/issues/14
 * because no node module exists yet.
 * @param {String} str
 * @returns {String} escaped string
 */
export const unescapeEncoding = (str) => {
    // Regexp declared inside the function to reset its state (because of the global flag).
    // cf https://stackoverflow.com/questions/1520800/why-does-a-regexp-with-global-flag-give-wrong-results
    const HEX_ESC = /\\(?:([0-9a-fA-F]{6})|([0-9a-fA-F]{1,5})(?: |(?![0-9a-fA-F])))/g;
    const OTHER_ESC = /\\(.)/g;
    const strUnescapedHex = str.replace(HEX_ESC, (_, hex1, hex2) => {
        const hex = hex1 || hex2;
        const code = parseInt(hex, 16);
        return String.fromCodePoint(code);
    });
    return strUnescapedHex.replace(OTHER_ESC, (_, char) => char);
};
