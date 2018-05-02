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
