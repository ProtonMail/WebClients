import type { Config } from 'dompurify';
import DOMPurify from 'dompurify';

import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';

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

export enum PurifyConfig {
    DEFAULT = 'default',
    RAW = 'raw',
    HTML = 'html',
    /** used for proton-mail messages */
    PROTONIZER = 'protonizer',
    CONTENT = 'content',
    CONTENT_WITHOUT_IMG = 'contentWithoutImg',
}

const CONFIG: { [key in PurifyConfig]: any } = {
    default: {
        ALLOWED_URI_REGEXP:
            /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|blob|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i, // eslint-disable-line no-useless-escape
        ADD_TAGS: ['proton-src', 'base'],
        ADD_ATTR: ['target', 'proton-src'],
        FORBID_TAGS: ['style', 'input', 'form', 'textarea'],
        FORBID_ATTR: ['srcset', 'for'],
        // Accept HTML (official) tags only and automatically excluding all SVG & MathML tags
        USE_PROFILES: { html: true },
    },
    // When we display a message we need to be global and return more information
    raw: { WHOLE_DOCUMENT: true, RETURN_DOM: true },
    html: { WHOLE_DOCUMENT: false, RETURN_DOM: true },
    protonizer: {
        FORBID_TAGS: ['form', 'video', 'audio'], // Override defaults to allow style (will be processed by juice afterward)
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

const getConfig = (type: PurifyConfig): Config => ({ ...CONFIG.default, ...(CONFIG[type] || {}) });

/**
 * Rename some attributes adding the "proton-" prefix configured in LIST_PROTON_ATTR
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

const filterFormAttributes = (node: Node) => {
    if (node.nodeName === 'INPUT' || node.nodeName === 'TEXTAREA') {
        const element = node as HTMLElement;
        const allowedAttributes = ['id', 'class', 'style', 'value', 'readonly', 'disabled', 'type', 'name'];

        Array.from(element.attributes).forEach((attr) => {
            if (!allowedAttributes.includes(attr.name)) {
                element.removeAttribute(attr.name);
            }
        });
    }
};

const purifyHTMLHooks = (active: boolean) => {
    if (active) {
        DOMPurify.addHook('beforeSanitizeElements', beforeSanitizeElements);
        DOMPurify.addHook('beforeSanitizeAttributes', filterFormAttributes);
        return;
    }

    DOMPurify.removeHook('beforeSanitizeElements');
};

const clean = (mode: PurifyConfig | 'str') => {
    const config = getConfig(mode === 'str' ? PurifyConfig.DEFAULT : mode);

    return (input: string | Node): string | Element => {
        DOMPurify.clearConfig();
        const value = DOMPurify.sanitize(input, config) as string | Element;
        purifyHTMLHooks(false); // Always remove the hooks
        if (mode === 'str') {
            // When a trusted type is available, DOMPurify returns a trustedHTML object and not a string, force cast it.
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
export const html = clean(PurifyConfig.RAW) as (input: Node) => Element;

/**
 * Sanitize input with a config similar than Squire + ours
 */
export const protonizer = (input: string, attachHooks: boolean): Element => {
    const process = clean(PurifyConfig.PROTONIZER);
    purifyHTMLHooks(attachHooks);
    return process(input) as Element;
};

/**
 * Sanitize input and returns the whole document

 */
export const content = clean(PurifyConfig.CONTENT) as (input: string) => Node;

/**
 * Sanitize input without images and returns the whole document

 */
export const contentWithoutImage = clean(PurifyConfig.CONTENT_WITHOUT_IMG) as (input: string) => Node;

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
    const div = parseStringToDOM(message).body;

    // Remove all images from the message
    const allImages = div.querySelectorAll('img');
    allImages.forEach((img) => img.remove());

    return { message: div.innerHTML, containsImages: allImages.length > 0 };
};

export const sanitizeSignature = (input: string) => {
    const process = clean(PurifyConfig.DEFAULT);
    return process(input.replace(/<a\s.*href="(.+?)".*>(.+?)<\/a>/, '[URL: $1] $2'));
};

/**
 * Cleanup performed for the message displayed in blockquote when replying
 * @param input
 * @warning this function alters the input element
 */
export const sanitizeComposerReply = (input: Element) => {
    if (!input || !('querySelectorAll' in input)) {
        return input;
    }

    // Remove all style tags
    input.querySelectorAll('style').forEach((style) => style.remove());

    return input;
};
