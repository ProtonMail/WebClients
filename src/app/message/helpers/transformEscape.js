import _ from 'lodash';

import transformBase from './transformBase';
import { unescapeCSSEncoding, uniqID } from '../../../helpers/string';

/**
 * Prevent escape url on the textContent if you display some code
 * inside the message
 * @param  {Node} node
 * @return {void}
 */
const recursiveCleanerCode = (node) => {
    _.each(node.children, (node) => {
        if (node.childElementCount) {
            return recursiveCleanerCode(node);
        }

        if (/proton-/g.test(node.textContent)) {
            node.textContent = node.textContent.replace(/proton-/g, '');
        }
    });
};

/**
 * Unescape the textContent only and inside a syntax Highlighting block
 * Compat
 *     - fontawesome
 *     - prism
 *     - etc.
 * @param  {Node} dom
 * @return {Node}
 */
const syntaxHighlighterFilter = (dom) => {
    const $pre = dom.querySelectorAll('.pre, pre, code');
    _.each($pre, (node) => {
        if ((node.nodeName === 'PRE' || node.nodeName === 'CODE') && !node.childElementCount) {
            node.textContent = node.textContent.replace(/proton-/g, '');
            return;
        }
        recursiveCleanerCode(node);
    });

    return dom;
};

/*
 * match attributes or elements with svg, xlink, srcset, src, background, poster.
 * the regex checks that the element/attribute is actually in an element by looking forward and seeing if it
 * ends properly with a >
 *
 * Another assumption in these regex are: all attributes use the " quotes instead of the ' quote. This is satisfied
 * by the previous standardization steps
 */
const BLACK_LIST = ['svg', 'xlink:href', 'srcset=', 'src=', 'data-src=', 'background=', 'poster='];
const FORBIDDEN_HTML = `(${BLACK_LIST.join('|')})`;
const NO_SPECIALS = '([^"><\\\\]|\\\\[^><])';
const NO_QUOTS = '(\\\\.|[^"\\\\])';
const HTML_STRING = `("${NO_QUOTS}*")`;
const VERIFY_ELEMENT_END = `(?=(${NO_SPECIALS}|${HTML_STRING})*>)`;

const STYLE_ATTRIBUTE = '(style\\s*=\\s*")';
// The style attribute_value makes sure that there is at least a url( string inside the attribute, otherwise
// it's no use to investigate it further.
const ATTRIBUTE_VALUE = '((?:(?:[^"\\\\]|\\\\.)*))(")';
const VERIFY_UNIQUE = '([^-])';

// Ensure that the forbidden attributes are not already escaped with proton- by checking that there is no '-' character in front of them.
const REGEXP_IS_BREAK = new RegExp(VERIFY_UNIQUE + FORBIDDEN_HTML + VERIFY_ELEMENT_END, 'gi');
const REGEXP_IS_STYLE = new RegExp(STYLE_ATTRIBUTE + ATTRIBUTE_VALUE + VERIFY_ELEMENT_END, 'gi');

/*
This is valid
    - background:&#117;r&#108;(
    - background:url&lpar;
    - etc.
*/
const CSS_URL = '((url)(\\(|&(#40|#x00028|lpar);))';
const REGEXP_URL_ATTR = new RegExp(CSS_URL, 'gi');

/**
 * Escape some WTF from the CSSParser, cf spec files
 * @param  {String} style
 * @return {String}
 */
const escapeURLinStyle = (style) => {
    // handle the case where the value is html encoded, e.g.:
    // background:&#117;rl(&quot;https://i.imgur.com/WScAnHr.jpg&quot;)

    const unescapedEncoding = unescapeCSSEncoding(style);
    const escapeFlag = unescapedEncoding !== style;

    const escapedStyle = unescapedEncoding.replace(/\\r/g, 'r').replace(REGEXP_URL_ATTR, 'proton-url(');

    if (escapedStyle === unescapedEncoding) {
        // nothing escaped: just return input
        return style;
    }

    return escapeFlag ? _.escape(escapedStyle) : escapedStyle;
};

const escapeURL = (input, action) => {
    if (action === 'user.inject') {
        return input;
    }
    /*
     * first grep the style, then we make sure the style doesn't contain urls...
     * This is needed because javascript regex doesn't support lookbehinds, making it impossible to match
     * an url and lookbehind us to see if we are in a style attribute
     */
    return input.replace(REGEXP_IS_STYLE, (match, p1, p2, p3) => `${p1}${escapeURLinStyle(p2)}${p3}`);
};

/**
 * Parsing base64 is expensive and can create a crash.
 * Here we can reduce input string from many Mb to less than 100kb, which is way easier to escape.
 * So instead of escaping everything with it too, we remove them from the HTML
 * and we replace it with an attribute with an uniq hash so we can load them
 * later for the user via injectMessageMedia component.
 * Store it inside inside a cache, an Angular Factory as we will need it for:
 *     - lazy load the image post render message
 *     - open the composer we need to lazy load it here too
 *
 * Source: regexp https://www.regextester.com/95505
 * @param  {String} input       Raw unescaped HTML
 * @param  {Object} cache       cacheBase64 factory
 * @param  {Boolean} activeCache
 * @return {String}
 */
function removeBase64(input, cache, activeCache) {
    /* eslint no-useless-escape: "off" */
    return input.replace(/src="data:image\/([a-zA-Z]*);base64,([^\"]*)\"/g, (match) => {
        const hash = uniqID();
        activeCache && cache.put(hash, match);
        return `data-proton-replace-base="${hash}"`;
    });
}

/**
 * Parse the dom and find all matching base64 custom tags we added
 * then replace them by the valid SRC for the base64.
 * @param  {Element} node
 * @param  {Object} cache cacheBase64 service
 * @return {String}       HTML
 */
export function attachBase64Parser(node, cache) {
    _.each(node.querySelectorAll('[data-proton-replace-base]'), (node) => {
        const hash = node.getAttribute('data-proton-replace-base');

        // Clean the string and remove \n else it won't load inside the browser
        const src = (cache.get(hash) || '')
            .replace(/^src="/, '')
            .replace(/"$/, '')
            .replace(/\n/, '');
        src && node.setAttribute('src', src);
        node.removeAttribute('data-proton-replace-base');
    });
    return node.innerHTML;
}

/**
 * Attach escaped base64 to the dom if the input is a txt
 * @param  {String} input HTML
 * @param  {Object} cache cacheBase64 service
 * @return {String}       HTML
 */
export function attachBase64(input, cache) {
    const [$parser] = $.parseHTML(`<div>${input}</div>`);
    return attachBase64Parser($parser, cache);
}

/**
 * Escape content for a message
 * Content can be a Document when we open a message, it's useful
 * in order to bind the base if it exists
 * @param  {Node} html                       Parser
 * @param  {String|Document} options.content Content to escape
 * @param  {String} options.action           Type of action
 * @param  {Boolean} options.isDocument      Type of content to escape
 * @return {Node}                            Parser
 */
export default (html, { content = '', action, isDocument, cache, activeCache = true }) => {
    const input = isDocument ? content.querySelector('body').innerHTML : content;
    const value = removeBase64(input, cache, activeCache);

    const breakHtml = value.replace(REGEXP_IS_BREAK, '$1proton-$2');
    html.innerHTML = escapeURL(breakHtml, action);
    return syntaxHighlighterFilter((isDocument ? transformBase : _.identity)(html, content));
};
