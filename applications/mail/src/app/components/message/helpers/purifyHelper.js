import DOMPurify from 'dompurify';

import { unicodeTag, unescapeCSSEncoding, escape } from './stringHelper';

/*
This is valid
    - background:&#117;r&#108;(
    - background:url&lpar;
    - etc.
*/
const CSS_URL = '((url)(\\(|&(#40|#x00028|lpar);))';
const REGEXP_URL_ATTR = new RegExp(CSS_URL, 'gi');
const { LIST_PROTON_ATTR, MAP_PROTON_ATTR } = [
    'data-src',
    'src',
    'srcset',
    'background',
    'poster',
    'xlink:href'
].reduce(
    (acc, attr) => {
        acc.LIST_PROTON_ATTR.push(`proton-${attr}`);
        acc.MAP_PROTON_ATTR[attr] = true;
        return acc;
    },
    {
        LIST_PROTON_ATTR: [],
        MAP_PROTON_ATTR: Object.create(null)
    }
);

const CONFIG = {
    default: {
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|blob|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i, // eslint-disable-line no-useless-escape
        ADD_TAGS: ['proton-src', 'base', 'proton-svg'],
        ADD_ATTR: ['target', 'proton-src'],
        FORBID_TAGS: ['style', 'input', 'form'],
        FORBID_ATTR: ['srcset']
    },
    // When we display a message we need to be global and return more informations
    raw: { WHOLE_DOCUMENT: true, RETURN_DOM: true },
    html: { WHOLE_DOCUMENT: false, RETURN_DOM: true },
    protonizer: {
        FORBID_ATTR: {},
        ADD_ATTR: ['target'].concat(LIST_PROTON_ATTR),
        WHOLE_DOCUMENT: true,
        RETURN_DOM: true
    },
    content: {
        ALLOW_UNKNOWN_PROTOCOLS: true,
        WHOLE_DOCUMENT: false,
        RETURN_DOM: true,
        RETURN_DOM_FRAGMENT: true
    }
};

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

    return escapeFlag ? escape(escapedStyle) : escapedStyle;
};

function beforeSanitizeElements(node) {
    // We only work on elements
    if (node.nodeType !== 1) {
        return node;
    }

    Array.from(node.attributes).forEach((type) => {
        const item = type.name;
        if (MAP_PROTON_ATTR[item]) {
            node.setAttribute('proton-' + item, node.getAttribute(item));
            node.removeAttribute(item);
        }

        if (item === 'style') {
            const escaped = escapeURLinStyle(node.getAttribute('style'));
            node.setAttribute('style', escaped);
        }
    });

    return node;
}

export const purifyHTMLHooks = (active) => {
    if (active) {
        return DOMPurify.addHook('beforeSanitizeElements', beforeSanitizeElements);
    }

    DOMPurify.removeHook('beforeSanitizeElements');
};

const getConfig = (type) => ({ ...CONFIG.default, ...(CONFIG[type] || {}) });
const clean = (mode) => {
    const config = getConfig(mode);
    return (input) => {
        DOMPurify.clearConfig();
        const value = DOMPurify.sanitize(input, config);
        purifyHTMLHooks(false); // Always remove the hooks
        if (mode === 'str') {
            // When trusted types is available, DOMPurify returns a trustedHTML object and not a string, force cast it.
            return value + '';
        }
        return value;
    };
};

/**
 * Custom config only for messages
 * @param  {String} input
 * @return {String}
 */
export const message = clean('str');

/**
 * Sanitize input with a config similar than Squire + ours
 * @param  {String} input
 * @return {Document}
 */
export const html = clean('raw');

/**
 * Sanitize input with a config similar than Squire + ours
 * @param  {String} input
 * @return {Document}
 */
export const protonizer = (input, attachHooks) => {
    const process = clean('protonizer');
    purifyHTMLHooks(attachHooks);
    return process(input);
};

/**
 * Sanitize input and returns the whole document
 * @param  {String} input
 * @return {Document}
 */
export const content = clean('content');

/**
 * Default config we don't want any custom behaviour
 * @return {String}
 */
export const input = (str) => DOMPurify.sanitize(str) + '';

export const toTagUnicode = unicodeTag;
