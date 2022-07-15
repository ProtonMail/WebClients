/*
 * This is valid
 * - background:&#117;r&#108;(
 * - background:&#117;r&#108;(
 * - background:url&lpar;
 * - etc.
 */
const CSS_URL = '((url|image-set)(\\(|&(#40|#x00028|lpar);))';
const REGEXP_URL_ATTR = new RegExp(CSS_URL, 'gi');

const REGEXP_HEIGHT_PERCENTAGE = /((?:min-|max-|line-)?height)\s*:\s*([\d.,]+%)/gi;
const REGEXP_POSITION_ABSOLUTE = /position\s*:\s*absolute/gi;
const REGEXP_MEDIA_DARK_STYLE = /\(\s*prefers-color-scheme\s*:\s*dark\s*\)/gi;

export const escape = (string: string) => {
    const UNESCAPE_HTML_REGEX = /[&<>"']/g;
    const HTML_ESCAPES = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
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
        '&#39;': "'",
    };

    return string.replace(ESCAPED_HTML_REGEX, HTML_UNESCAPES as any);
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

    const handleEscape = (radix: number) => (ignored: any, val: string) => {
        try {
            return String.fromCodePoint(Number.parseInt(val, radix));
        } catch {
            // Unescape regexps have some limitations, for those rare situations, fromCodePoint can throw
            // One real found is: `font-family:\2018Calibri`
            return '';
        }
    };

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

/**
 * Input can be escaped multiple times to escape replacement while still works
 * Best solution I found is to escape recursively until nothing change anymore
 * @argument str style to unescape
 * @augments stop extra security to prevent infinite loop
 */
export const recurringUnescapeCSSEncoding = (str: string, stop = 100): string => {
    const escaped = unescapeCSSEncoding(str);
    if (escaped === str || stop === 0) {
        return escaped;
    } else {
        return recurringUnescapeCSSEncoding(escaped, stop - 1);
    }
};

/**
 * Escape some WTF from the CSSParser, cf spec files
 * @param  {String} style
 * @return {String}
 */
export const escapeURLinStyle = (style: string) => {
    // handle the case where the value is html encoded, e.g.:
    // background:&#117;rl(&quot;https://i.imgur.com/WScAnHr.jpg&quot;)

    const unescapedEncoding = recurringUnescapeCSSEncoding(style);
    const escapeFlag = unescapedEncoding !== style;

    const escapedStyle = unescapedEncoding.replace(/\\r/g, 'r').replace(REGEXP_URL_ATTR, 'proton-$2(');

    if (escapedStyle === unescapedEncoding) {
        // nothing escaped: just return input
        return style;
    }

    return escapeFlag ? escape(escapedStyle) : escapedStyle;
};

export const escapeForbiddenStyle = (style: string): string => {
    let parsedStyle = style
        .replaceAll(REGEXP_POSITION_ABSOLUTE, 'position: relative')
        .replaceAll(REGEXP_HEIGHT_PERCENTAGE, (rule, prop) => {
            // Replace nothing in this case.
            if (['line-height', 'max-height'].includes(prop)) {
                return rule;
            }

            return `${prop}: unset`;
        })
        // "never" is not a valid value, it's meant to be invalid and break the media query
        .replaceAll(REGEXP_MEDIA_DARK_STYLE, '(prefers-color-scheme: never)');

    return parsedStyle;
};

const HTML_ENTITIES_TO_REMOVE_CHAR_CODES: number[] = [
    9, // Tab : &Tab; - &#x00009; - &#9;
    10, // New line : &NewLine; - &#x0000A; - &#10;
    173, // Soft hyphen : &shy; - &#x000AD; - &#173;
    8203, // Zero width space : &ZeroWidthSpace; - &NegativeVeryThinSpace; - &NegativeThinSpace; - &NegativeMediumSpace; - &NegativeThickSpace; - &#x0200B; - &#8203;
];

/**
 * Remove completely some HTML entities from a string
 * @param {String} string
 * @return {String}
 */
export const unescapeFromString = (string: string) => {
    const toRemove = HTML_ENTITIES_TO_REMOVE_CHAR_CODES.map((charCode) => String.fromCharCode(charCode));
    const regex = new RegExp(toRemove.join('|'), 'g');

    return string.replace(regex, '');
};
