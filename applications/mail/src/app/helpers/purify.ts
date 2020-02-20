import DOMPurify, { Config } from 'dompurify';

import { unicodeTag, unescapeCSSEncoding, escape } from './string';

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
        LIST_PROTON_ATTR: [] as string[],
        MAP_PROTON_ATTR: Object.create(null)
    }
);

const CONFIG: { [key: string]: any } = {
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
const escapeURLinStyle = (style: string) => {
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

function beforeSanitizeElements(node: Element) {
    // We only work on elements
    if (node.nodeType !== 1) {
        return node;
    }

    Array.from(node.attributes).forEach((type) => {
        const item = type.name;
        if (MAP_PROTON_ATTR[item]) {
            node.setAttribute('proton-' + item, node.getAttribute(item) || '');
            node.removeAttribute(item);
        }

        if (item === 'style') {
            const escaped = escapeURLinStyle(node.getAttribute('style') || '');
            node.setAttribute('style', escaped);
        }
    });

    return node;
}

export const purifyHTMLHooks = (active: boolean) => {
    if (active) {
        return DOMPurify.addHook('beforeSanitizeElements', beforeSanitizeElements);
    }

    DOMPurify.removeHook('beforeSanitizeElements');
};

const getConfig = (type: string): Config => ({ ...CONFIG.default, ...(CONFIG[type] || {}) });

const clean = (mode: string) => {
    const config = getConfig(mode);

    return (input: string | Node): string | Element => {
        DOMPurify.clearConfig();
        const value = DOMPurify.sanitize(input, config) as string | Element;
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
 */
export const message = clean('str') as (input: string) => string;

/**
 * Sanitize input with a config similar than Squire + ours
 */
export const html = clean('raw') as (input: Node) => Element;

/**
 * Sanitize input with a config similar than Squire + ours
 */
export const protonizer = (input: string, attachHooks: boolean): Element => {
    const process = clean('protonizer');
    purifyHTMLHooks(attachHooks);
    return process(input) as Element;
};

/**
 * Sanitize input and returns the whole document

 */
export const content = clean('content') as (input: string) => Node;

/**
 * Default config we don't want any custom behaviour
 */
export const input = (str: string) => DOMPurify.sanitize(str, {}) + '';

export const toTagUnicode = unicodeTag;
