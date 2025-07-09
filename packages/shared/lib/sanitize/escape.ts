/*
 * This is valid
 * - background:&#117;r&#108;(
 * - background:&#117;r&#108;(
 * - background:url&lpar;
 * - etc.
 */
const CSS_URL = '((url|image-set)\\s*(\\(|&(#40|#x00028|lpar);))';
const REGEXP_URL_ATTR = new RegExp(CSS_URL, 'gi');

const REGEXP_HEIGHT_PERCENTAGE = /((?:min-|max-|line-)?height)\s*:\s*([\d.,]+%)/gi;
const REGEXP_POSITION_ABSOLUTE = /position\s*:\s*absolute/gi;
const REGEXP_MEDIA_DARK_STYLE_2 = /Color-scheme/gi;

const HTML_ESCAPES: [search: string, replace: string][] = [
    ['&', '&amp;'],
    ['<', '&lt;'],
    ['>', '&gt;'],
    ['"', '&quot;'],
    ["'", '&#39;'],
];

const HTML_UNESCAPES: [search: string, replace: string][] = HTML_ESCAPES.map(([a, b]) => [b, a]);

export const escape = (string: string) => {
    HTML_ESCAPES.forEach(([search, replace]) => {
        string = string.replaceAll(search, replace);
    });

    return string;
};

export const unescape = (string: string) => {
    HTML_UNESCAPES.forEach(([search, replace]) => {
        string = string.replaceAll(search, replace);
    });

    return string;
};

/**
 * Unescape a string in hex or octal encoding.
 * See https://www.w3.org/International/questions/qa-escapes#css_other for all possible cases.
 */
export const unescapeCSSEncoding = (str: string) => {
    // Regexp declared inside the function to reset its state (because of the global flag).
    // cf https://stackoverflow.com/questions/1520800/why-does-a-regexp-with-global-flag-give-wrong-results
    // Fixed to handle all CSS whitespace characters that can terminate escape sequences
    const UNESCAPE_CSS_ESCAPES_REGEX = /\\([0-9A-Fa-f]{1,6})[ \t\n\r\f]?/g;
    const UNESCAPE_HTML_DEC_REGEX = /&#(\d+)(;|(?=[^\d;]))/g;
    const UNESCAPE_HTML_HEX_REGEX = /&#x([0-9A-Fa-f]+)(;|(?=[^\d;]))/g;
    const OTHER_ESC = /\\(.)/g;

    const handleEscape = (radix: number) => (_ignored: any, val: string) => {
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
 * Best solution I found is to escape recursively
 * This is done 5 times maximum. If there are too much escape, we consider the string
 * "invalid" and we prefer to return an empty string
 * @argument str style to unescape
 * @augments stop extra security to prevent infinite loop
 */
export const recurringUnescapeCSSEncoding = (str: string, stop = 5): string => {
    const escaped = unescapeCSSEncoding(str);
    if (escaped === str) {
        return escaped;
    } else if (stop === 0) {
        return '';
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

    // If we cancelled the unescape encoding step because it was too long, we are returning an empty string.
    // In that case we also need to return an empty string in this function, otherwise we will not escape correctly the content
    if (unescapedEncoding === '') {
        return '';
    }

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
        // To replace if we support dark styles in the future.
        // Disable the Color-scheme so that the message do not use dark mode, message always being displayed on a white bg today
        .replaceAll(REGEXP_MEDIA_DARK_STYLE_2, 'proton-disabled-Color-scheme');

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
