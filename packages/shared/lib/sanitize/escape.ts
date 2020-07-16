/*
 * This is valid
 * - background:&#117;r&#108;(
 * - background:&#117;r&#108;(
 * - background:url&lpar;
 * - etc.
 */
const CSS_URL = '((url)(\\(|&(#40|#x00028|lpar);))';
const REGEXP_URL_ATTR = new RegExp(CSS_URL, 'gi');

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

/**
 * Escape some WTF from the CSSParser, cf spec files
 * @param  {String} style
 * @return {String}
 */
export const escapeURLinStyle = (style: string) => {
    // handle the case where the value is html encoded, e.g.:
    // background:&#117;rl(&quot;https://i.imgur.com/WScAnHr.jpg&quot;)

    const unescapedEncoding = unescapeCSSEncoding(style);
    const escapeFlag = unescapedEncoding !== style;

    const escapedStyle = unescapedEncoding.replace(/\\r/g, 'r').replace(REGEXP_URL_ATTR, 'proton-url(');

    if (escapedStyle === unescapedEncoding) {
        // nothing escaped: just return input
        return style;
    }

    return escapeFlag ? escape(escapedStyle) : escapedStyle;
};
