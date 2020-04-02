// import getRandomValues from 'get-random-values';

// import { EMAIL_FORMATING } from '../app/constants';

export const EMAIL_FORMATING = {
    OPEN_TAG_AUTOCOMPLETE: '‹',
    CLOSE_TAG_AUTOCOMPLETE: '›',
    OPEN_TAG_AUTOCOMPLETE_RAW: '<',
    CLOSE_TAG_AUTOCOMPLETE_RAW: '>'
};

const {
    OPEN_TAG_AUTOCOMPLETE,
    CLOSE_TAG_AUTOCOMPLETE,
    OPEN_TAG_AUTOCOMPLETE_RAW,
    CLOSE_TAG_AUTOCOMPLETE_RAW
} = EMAIL_FORMATING;

export const MAP_TAGS = {
    [OPEN_TAG_AUTOCOMPLETE_RAW]: OPEN_TAG_AUTOCOMPLETE,
    [CLOSE_TAG_AUTOCOMPLETE_RAW]: CLOSE_TAG_AUTOCOMPLETE,
    [OPEN_TAG_AUTOCOMPLETE]: OPEN_TAG_AUTOCOMPLETE_RAW,
    [CLOSE_TAG_AUTOCOMPLETE]: CLOSE_TAG_AUTOCOMPLETE_RAW
};

export const escape = (string: string) => {
    const UNESCAPE_HTML_REGEX = /[&<>"']/g;
    const HTML_ESCAPES = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    };

    return string.replace(UNESCAPE_HTML_REGEX, HTML_ESCAPES as any);
};

export const unescape = (string: string) => {
    const ESCAPED_HTML_REGEX = /&(?:amp|lt|gt|quot|#39);/g;
    const HTML_UNESCAPES = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'"
    };

    return string.replace(ESCAPED_HTML_REGEX, HTML_UNESCAPES as any);
};

/**
 * Replace custom unicode escape for chevrons by default
 * Replace <> (for a tag) via unicode or reverse it
 * mode undefined for toUnicode, reverse for unicode -> <|>
 */
export function unicodeTag(input = '', mode: 'reverse' | undefined) {
    if (mode === 'reverse') {
        const matchTagUnicodeOpenClose = () => new RegExp(`${OPEN_TAG_AUTOCOMPLETE}|${CLOSE_TAG_AUTOCOMPLETE}`, 'ig');

        return input.replace(matchTagUnicodeOpenClose(), (match) => MAP_TAGS[match] || '');
    }

    const matchTagOpenClose = () => new RegExp(`${OPEN_TAG_AUTOCOMPLETE_RAW}|${CLOSE_TAG_AUTOCOMPLETE_RAW}`, 'ig');
    return input.replace(matchTagOpenClose(), (match) => MAP_TAGS[match] || '');
}

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

/**
 * Unescape a string in hex or octal encoding.
 * See https://www.w3.org/International/questions/qa-escapes#css_other for all possible cases.
 */
export const unescapeCSSEncoding = (str: string) => {
    // Regexp declared inside the function to reset its state (because of the global flag).
    // cf https://stackoverflow.com/questions/1520800/why-does-a-regexp-with-global-flag-give-wrong-results
    const UNESCAPE_CSS_ESCAPES_REGEX = /\\([0-9A-Fa-f]{1,6}) ?/g;
    const UNESCAPE_HTML_DEC_REGEX = /&#(\d+)(;|(?=[^\d;]))/g;
    const UNESCAPE_HTML_HEX_REGEX = /&#x([0-9A-Fa-f]+)(;|(?=[^\d;]))/g;
    const OTHER_ESC = /\\(.)/g;

    const handleEscape = (radix: number) => (ignored: any, val: string) =>
        String.fromCodePoint(Number.parseInt(val, radix));
    /*
     * basic unescaped named sequences: &amp; etcetera, lodash does not support a lot, but that is not a problem for our case.
     * Actually handling all escaped sequences would mean keeping track of a very large and ever growing amount of named sequences
     */
    const namedUnescaped = unescape(str);
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
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
};

export const uniqID = () => {
    return `pt${Math.random()
        .toString(32)
        .slice(2, 12)}-${Date.now()}`;
};

/**
 * Generate a random string.
 * @param {Number} length
 * @return {string}
 */
// export const getRandomString = (length) => {
//     const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//     let i;
//     let result = '';

//     const values = getRandomValues(new Uint32Array(length));

//     for (i = 0; i < length; i++) {
//         result += charset[values[i] % charset.length];
//     }

//     return result;
// };

export const replaceLineBreaks = (content: string) => {
    return content.replace(/(?:\r\n|\r|\n)/g, '<br />');
};

/**
 * Generate a hash
 */
export const hash = (str = '') => {
    // bitwise or with 0 ( | 0) makes sure we are using integer arithmetic and not floating point arithmetic
    return str.split('').reduce((prevHash, currVal) => (prevHash * 31 + currVal.charCodeAt(0)) | 0, 0);
};
