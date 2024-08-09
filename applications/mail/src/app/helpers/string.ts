export const EMAIL_FORMATING = {
    OPEN_TAG_AUTOCOMPLETE: '‹',
    CLOSE_TAG_AUTOCOMPLETE: '›',
    OPEN_TAG_AUTOCOMPLETE_RAW: '<',
    CLOSE_TAG_AUTOCOMPLETE_RAW: '>',
};

const { OPEN_TAG_AUTOCOMPLETE, CLOSE_TAG_AUTOCOMPLETE, OPEN_TAG_AUTOCOMPLETE_RAW, CLOSE_TAG_AUTOCOMPLETE_RAW } =
    EMAIL_FORMATING;

export const MAP_TAGS = {
    [OPEN_TAG_AUTOCOMPLETE_RAW]: OPEN_TAG_AUTOCOMPLETE,
    [CLOSE_TAG_AUTOCOMPLETE_RAW]: CLOSE_TAG_AUTOCOMPLETE,
    [OPEN_TAG_AUTOCOMPLETE]: OPEN_TAG_AUTOCOMPLETE_RAW,
    [CLOSE_TAG_AUTOCOMPLETE]: CLOSE_TAG_AUTOCOMPLETE_RAW,
};

/**
 * Converts the integer to a 32-bit base encoded string in 2s complement format, so that it doesn't contain a sign "-"
 * @param val The integer to be encoded
 * @param bits The amount of bits per character
 */
export const toUnsignedString = (val: number, bits: number) => {
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

export const containsHTMLTag = (input = '') => {
    return /<\/?[a-z][\s\S]*>/i.test(input);
};

export const ucFirst = (input = '') => {
    return input.charAt(0).toUpperCase() + input.slice(1);
};

/**
 * Extract value between chevrons
 * @param str ex: Andy <andy@pm.me>
 * @return ex: andy@pm.me
 */
export const extractChevrons = (str = '') => {
    const CHEVRONS_REGEX = /<([^>]+)>/g;
    const [, match = ''] = CHEVRONS_REGEX.exec(str) || [];
    return match;
};

/**
 * @{link https://css-tricks.com/snippets/javascript/htmlentities-for-javascript/}
 */
export const htmlEntities = (str = '') => {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

export const uniqID = () => {
    return `pt${Math.random().toString(32).slice(2, 12)}-${Date.now()}`;
};

const lineBreaksRegex = /(?:\r\n|\r|\n)/g;

export const replaceLineBreaks = (content: string) => {
    return content.replace(lineBreaksRegex, '<br />');
};

export const removeLineBreaks = (content: string) => {
    return content.replace(lineBreaksRegex, '');
};

/**
 * Generate a hash
 */
export const hash = (str = '') => {
    // bitwise or with 0 ( | 0) makes sure we are using integer arithmetic and not floating point arithmetic
    return str.split('').reduce((prevHash, currVal) => (prevHash * 31 + currVal.charCodeAt(0)) | 0, 0);
};
