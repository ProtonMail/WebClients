import DOMPurify, { Config } from 'dompurify';

import { escapeForbiddenStyle, escapeURLinStyle } from './escape';

const toMap = (list: string[]) =>
    list.reduce<{ [key: string]: true | undefined }>((acc, key) => {
        acc[key] = true;
        return acc;
    }, {});

const LIST_PROTON_ATTR = ['data-src', 'src', 'srcset', 'background', 'poster', 'xlink:href', 'href'];
const MAP_PROTON_ATTR = toMap(LIST_PROTON_ATTR);
const PROTON_ATTR_TAG_WHITELIST = ['a', 'base', 'area'];
const MAP_PROTON_ATTR_TAG_WHITELIST = toMap(PROTON_ATTR_TAG_WHITELIST.map((tag) => tag.toUpperCase()));

const shouldPrefix = (tagName: string, attributeName: string) => {
    return !MAP_PROTON_ATTR_TAG_WHITELIST[tagName] && MAP_PROTON_ATTR[attributeName];
};

const CONFIG: { [key: string]: any } = {
    default: {
        ALLOWED_URI_REGEXP:
            /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|blob|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i, // eslint-disable-line no-useless-escape
        ADD_TAGS: ['proton-src', 'base'],
        ADD_ATTR: ['target', 'proton-src'],
        FORBID_TAGS: ['style', 'input', 'form'],
        FORBID_ATTR: ['srcset', 'for'],
        // Accept HTML (official) tags only and automatically excluding all SVG & MathML tags
        USE_PROFILES: { html: true },
    },
    // When we display a message we need to be global and return more information
    raw: { WHOLE_DOCUMENT: true, RETURN_DOM: true },
    html: { WHOLE_DOCUMENT: false, RETURN_DOM: true },
    protonizer: {
        FORBID_TAGS: ['input', 'form'], // Override defaults to allow style (will be processed by juice afterward)
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
    contentWithoutImg: {
        ALLOW_UNKNOWN_PROTOCOLS: true,
        WHOLE_DOCUMENT: false,
        RETURN_DOM: true,
        RETURN_DOM_FRAGMENT: true,
        FORBID_TAGS: ['style', 'input', 'form', 'img'],
    },
};

const getConfig = (type: string): Config => ({ ...CONFIG.default, ...(CONFIG[type] || {}) });

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

    // Manage styles element
    if (element.tagName === 'STYLE') {
        const escaped = escapeForbiddenStyle(escapeURLinStyle(element.innerHTML || ''));
        element.innerHTML = escaped;
    }

    Array.from(element.attributes).forEach((type) => {
        const item = type.name;

        if (shouldPrefix(element.tagName, item)) {
            element.setAttribute(`proton-${item}`, element.getAttribute(item) || '');
            element.removeAttribute(item);
        }

        // Manage element styles tag
        if (item === 'style') {
            const escaped = escapeForbiddenStyle(escapeURLinStyle(element.getAttribute('style') || ''));
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
        const value = DOMPurify.sanitize(input, config) as string | Element;
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
    return process(input) as Element;
};

/**
 * Sanitize input and returns the whole document

 */
export const content = clean('content') as (input: string) => Node;

/**
 * Sanitize input without images and returns the whole document

 */
export const contentWithoutImage = clean('contentWithoutImg') as (input: string) => Node;

/**
 * Default config we don't want any custom behaviour
 */
export const input = (str: string) => {
    const result = DOMPurify.sanitize(str, {});
    return `${result}`;
};

/**
 * We don't want to display images inside the autoreply composer.
 * There is an issue on Firefox where images can still be added by drag&drop,
 * and squire is not able to detect them. That's why we are removing them here.
 */
export const removeImagesFromContent = (message: string) => {
    const div = document.createElement('div');
    div.innerHTML = message;

    // Remove all images from the message
    const allImages = div.querySelectorAll('img');
    allImages.forEach((img) => img.remove());

    return { message: div.innerHTML, containsImages: allImages.length > 0 };
};

export const sanitizeSignature = (input: string) => {
    const process = clean('default');
    return process(input.replace(/<a\s.*href="(.+?)".*>(.+?)<\/a>/, '[URL: $1] $2'));
};
