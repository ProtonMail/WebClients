import type { Config } from 'dompurify';
import DOMPurify from 'dompurify';

import { escapeForbiddenStyle, escapeURLinStyle, unescape } from './escape';

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
    /** Quoted forward/reply HTML inserted into the composer */
    COMPOSER_BLOCKQUOTE = 'composerBlockquote',
}

const CONFIG: { [key in PurifyConfig]: any } = {
    default: {
        ALLOWED_URI_REGEXP:
            /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|blob|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
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
        FORBID_ATTR: [],
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
    composerBlockquote: {
        // Quoted messages have already passed through the Mail renderer. Keep their
        // presentation and image metadata while removing elements that can execute
        // code or create a new browsing context inside the composer.
        // FORBID_TAGS/FORBID_ATTR replace the default entries rather than extending them
        // (see getConfig), so anything still needed from `default` has to be repeated here.
        // `style` is intentionally absent from FORBID_TAGS: stripping style tags from quoted
        // content is gated behind the RemoveReplyStyles flag (see sanitizeComposerReply), and
        // forbidding them here would make that kill switch unable to restore the old behaviour.
        ADD_ATTR: ['target', ...LIST_PROTON_ATTR.map((attr) => `proton-${attr}`)],
        FORBID_ATTR: ['srcset', 'for'],
        FORBID_TAGS: [
            'input',
            'form',
            'textarea',
            'script',
            'iframe',
            'frame',
            'object',
            'embed',
            'applet',
            'link',
            'meta',
            'base',
        ],
    },
};

const getConfig = (type: PurifyConfig): Config => ({ ...CONFIG.default, ...(CONFIG[type] || {}) });

const sanitizeHtmlClass = (element: HTMLElement) => {
    const attributeValue = element?.getAttribute('class');
    if (!attributeValue) {
        return;
    }

    const sanitized = unescape(attributeValue)
        .replace(/<[^>]*>?/g, ' ')
        .replace(/(--!?|])>/g, ' ')
        .replace(/["'>]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (sanitized) {
        element.setAttribute('class', sanitized);
    } else {
        element.removeAttribute('class');
    }
};

const sanitizeHtmlStyle = (element: HTMLElement) => {
    const attributeValue = element?.getAttribute('style');
    if (!attributeValue) {
        return;
    }

    const sanitized = unescape(attributeValue)
        .replace(/<[^>]*>?/g, ' ')
        .replace(/(--!?|])>/g, ' ')
        .replace(/["'>]/g, ' ')
        .split(';')
        .filter((declaration) => /^\s*-?-?[a-z][\w-]*\s*:/i.test(declaration))
        .join(';')
        .concat(';')
        .replace(/\s+/g, ' ')
        .trim();

    if (sanitized) {
        element.setAttribute('style', sanitized);
    } else {
        element.removeAttribute('style');
    }
};

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

    if (element.tagName.toUpperCase() === 'STYLE') {
        const escaped = escapeForbiddenStyle(escapeURLinStyle(element.innerHTML || ''));
        element.innerHTML = escaped;
    }

    if (element.tagName.toUpperCase() === 'BODY') {
        sanitizeHtmlClass(element);
        sanitizeHtmlStyle(element);
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

/**
 * DOMPurify hooks are global, so they must be set to the exact state a call needs right before
 * sanitizing rather than being cleaned up afterwards only.
 */
const purifyHTMLHooks = (active: boolean) => {
    DOMPurify.removeHooks('beforeSanitizeElements');
    DOMPurify.removeHooks('beforeSanitizeAttributes');

    if (active) {
        DOMPurify.addHook('beforeSanitizeElements', beforeSanitizeElements);
        DOMPurify.addHook('beforeSanitizeAttributes', filterFormAttributes);
    }
};

const clean = (mode: PurifyConfig | 'str', attachHooks = false) => {
    const config = getConfig(mode === 'str' ? PurifyConfig.DEFAULT : mode);

    return (input: string | Node): string | Element => {
        DOMPurify.clearConfig();
        purifyHTMLHooks(attachHooks);
        try {
            const value = DOMPurify.sanitize(input, config) as string | Element;
            if (mode === 'str') {
                // When a trusted type is available, DOMPurify returns a trustedHTML object and not a string, force cast it.
                return `${value}`;
            }
            return value;
        } finally {
            purifyHTMLHooks(false); // Always remove the hooks
        }
    };
};

/**
 * Custom config only for messages
 */
export const sanitizeMessage = clean('str') as (input: string) => string;

/**
 * Sanitize input with a config similar than Squire + ours
 */
export const html = clean(PurifyConfig.RAW) as (input: Node) => Element;

/**
 * Sanitize input with a config similar than Squire + ours
 */
export const protonizer = (input: string, attachHooks: boolean): Element => {
    const process = clean(PurifyConfig.PROTONIZER, attachHooks);
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
export const sanitizeString = (str: string) => {
    const result = DOMPurify.sanitize(str, {});
    return `${result}`;
};

/**
 * We don't want to display images inside the autoreply composer.
 * There is an issue on Firefox where images can still be added by drag&drop,
 * and squire is not able to detect them. That's why we are removing them here.
 */
export const removeImagesFromContent = (message: string) => {
    const parser = new DOMParser();
    const parsedDocument = parser.parseFromString(message, 'text/html');

    // Remove all images from the message
    const allImages = parsedDocument.body.querySelectorAll('img');
    allImages.forEach((img) => img.remove());

    return { message: parsedDocument.body.innerHTML, containsImages: allImages.length > 0 };
};

export const sanitizeSignature = (input: string) => {
    const process = clean(PurifyConfig.DEFAULT);
    return process(input.replace(/<a\s.*href="(.+?)".*>(.+?)<\/a>/, '[URL: $1] $2'));
};

const cleanToString = (mode: PurifyConfig) => {
    // Note: Not using the hooks since the input is already sanitized by the Mail renderer
    return (input: string): string => {
        DOMPurify.clearConfig();
        const config = getConfig(mode);
        purifyHTMLHooks(false);
        try {
            const value = DOMPurify.sanitize(input, config);
            return `${value}`;
        } finally {
            purifyHTMLHooks(false);
        }
    };
};

/**
 * Sanitize HTML for quoted forward/reply content before it is inserted into the composer.
 */
export const sanitizeComposerBlockquoteHtml = cleanToString(PurifyConfig.COMPOSER_BLOCKQUOTE);

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
