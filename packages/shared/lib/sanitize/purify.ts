import DOMPurify, { Config } from 'dompurify';

import { escapeURLinStyle } from './escape';

const toMap = (list: string[]) =>
    list.reduce<{ [key: string]: true | undefined }>((acc, key) => {
        acc[key] = true;
        return acc;
    }, {});

const LIST_PROTON_TAG = ['svg'];
// const MAP_PROTON_TAG = toMap(LIST_PROTON_TAG);
const LIST_PROTON_ATTR = ['data-src', 'src', 'srcset', 'background', 'poster', 'xlink:href'];
const MAP_PROTON_ATTR = toMap(LIST_PROTON_ATTR);
const LIST_STYLE_PROPERTIES_REMOVED = ['position', 'left', 'right', 'top', 'bottom'];

const CONFIG: { [key: string]: any } = {
    default: {
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|blob|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i, // eslint-disable-line no-useless-escape
        ADD_TAGS: ['proton-src', 'base', 'proton-svg'],
        ADD_ATTR: ['target', 'proton-src'],
        FORBID_TAGS: ['style', 'input', 'form'],
        FORBID_ATTR: ['srcset', 'for'],
    },
    // When we display a message we need to be global and return more informations
    raw: { WHOLE_DOCUMENT: true, RETURN_DOM: true },
    html: { WHOLE_DOCUMENT: false, RETURN_DOM: true },
    protonizer: {
        FORBID_ATTR: {},
        ADD_ATTR: ['target', ...LIST_PROTON_ATTR.map((attr) => `proton-${attr}`)],
        WHOLE_DOCUMENT: true,
        RETURN_DOM: true,
    },
    content: {
        ALLOW_UNKNOWN_PROTOCOLS: true,
        WHOLE_DOCUMENT: false,
        RETURN_DOM: true,
        RETURN_DOM_FRAGMENT: true,
    },
};

const getConfig = (type: string): Config => ({ ...CONFIG.default, ...(CONFIG[type] || {}) });

/**
 * Remove some style properties configured in LIST_STYLE_PROPERTIES_REMOVED
 */
const sanitizeStyle = (node: Node) => {
    // We only work on elements
    if (node.nodeType !== 1) {
        return node;
    }

    const element = node as HTMLElement;

    LIST_STYLE_PROPERTIES_REMOVED.forEach((prop) => {
        element.style[prop as any] = '';
    });
};

/**
 * Rename some tags adding the proton- prefix configured in LIST_PROTON_TAG
 * This process is done outside and after DOMPurify because renaming tags in DOMPurify don't work
 * Currently used only for svg tags which are considered as image
 */
const sanitizeElements = (document: Element) => {
    LIST_PROTON_TAG.forEach((tagName) => {
        const svgs = document.querySelectorAll(tagName);
        svgs.forEach((element) => {
            const newElement = element.ownerDocument.createElement(`proton-${tagName}`);
            // Copy the children
            while (element.firstChild) {
                newElement.appendChild(element.firstChild); // *Moves* the child
            }

            element.getAttributeNames().forEach((name) => {
                newElement.setAttribute(name, element.getAttribute(name) || '');
            });

            element.parentElement?.replaceChild(newElement, element);
        });
    });
};

/**
 * Rename some attributes adding the proton- prefix configured in LIST_PROTON_ATTR
 * Also escape urls in style attributes
 */
const beforeSanitizeElements = (node: Node) => {
    // We only work on elements
    if (node.nodeType !== 1) {
        return node;
    }

    const element = node as HTMLElement;

    Array.from(element.attributes).forEach((type) => {
        const item = type.name;

        if (MAP_PROTON_ATTR[item]) {
            element.setAttribute(`proton-${item}`, element.getAttribute(item) || '');
            element.removeAttribute(item);
        }

        if (item === 'style') {
            const escaped = escapeURLinStyle(element.getAttribute('style') || '');
            element.setAttribute('style', escaped);
        }
    });

    return element;
};

const purifyHTMLHooks = (active: boolean) => {
    if (active) {
        DOMPurify.addHook('beforeSanitizeElements', beforeSanitizeElements);
        return;
    }

    DOMPurify.removeHook('beforeSanitizeElements');
};

const clean = (mode: string) => {
    const config = getConfig(mode);

    return (input: string | Node): string | Element => {
        DOMPurify.clearConfig();
        DOMPurify.addHook('afterSanitizeElements', sanitizeStyle);
        const value = DOMPurify.sanitize(input, config) as string | Element;
        DOMPurify.removeHook('afterSanitizeElements');
        purifyHTMLHooks(false); // Always remove the hooks
        if (mode === 'str') {
            // When trusted types is available, DOMPurify returns a trustedHTML object and not a string, force cast it.
            return `${value}`;
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
    const resultDocument = process(input) as Element;
    sanitizeElements(resultDocument);
    return resultDocument;
};

/**
 * Sanitize input and returns the whole document

 */
export const content = clean('content') as (input: string) => Node;

/**
 * Default config we don't want any custom behaviour
 */
export const input = (str: string) => {
    const result = DOMPurify.sanitize(str, {});
    return `${result}`;
};
