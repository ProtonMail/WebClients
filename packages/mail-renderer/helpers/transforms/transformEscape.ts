import { uniqID } from '@proton/mail/helpers/string';
import type { Base64Cache } from '@proton/mail/hooks/useBase64Cache';
import { removeHTMLComments } from '@proton/shared/lib/helpers/string';
import { protonizer as purifyHTML } from '@proton/shared/lib/sanitize';

export const IMG_SRC_BASE_64_PREFIX = 'data-proton-replace-base';

/**
 * Parsing base64 is expensive and can create a crash.
 * Here we can reduce input string from many Mb to less than 100kb, which is way easier to escape.
 * So instead of escaping everything with it too, we remove them from the HTML
 * and we replace it with an attribute with an uniq hash so we can load them
 * later for the user via injectMessageMedia component.
 * Store it inside a cache
 *     - lazy load the image post render message
 *     - open the composer we need to lazy load it here too
 *
 * Source: regexp https://www.regextester.com/95505
 * @param input Raw unescaped HTML
 */
export const removeBase64 = (input: string, cache?: Base64Cache): string => {
    /* eslint no-useless-escape: "off" */
    return input.replace(/src="data:image\/(?:([a-zA-Z]*)|svg\+xml);base64,([^\"]*)\"/g, (match) => {
        const hash = uniqID();
        if (cache) {
            cache.set(hash, match);
        }
        return `${IMG_SRC_BASE_64_PREFIX}="${hash}"`;
    });
};

/**
 * Parse the dom and find all matching base64 custom tags we added
 * then replace them by the valid SRC for the base64.
 * @return HTML
 */
export const attachBase64 = (element: Element, cache: Base64Cache) => {
    const nodes = [...element.querySelectorAll(`[${IMG_SRC_BASE_64_PREFIX}]`)];
    nodes.forEach((node) => {
        const hash = node.getAttribute(IMG_SRC_BASE_64_PREFIX);

        // Clean the string and remove \n else it won't load inside the browser
        const src = (cache.get(hash || '') || '')
            .replace(/^src="/, '')
            .replace(/"$/, '')
            .replace(/\n/, '');
        if (src) {
            node.setAttribute('src', src);
        }
        node.removeAttribute(IMG_SRC_BASE_64_PREFIX);
    });
};

/**
 * Escape content for a message
 * Content can be a Document when we open a message, it's useful
 * in order to bind the base if it exists
 * @param message Message to escape
 * @param action Type of action
 */
export const transformEscape = (content = '', cache?: Base64Cache) => {
    // We are removing all comments from the HTML string,
    // so that we can avoid having potential issues when removing Base 64 images wrongly formatted
    const withoutComment = removeHTMLComments(content);
    const value = removeBase64(withoutComment, cache);
    const document = purifyHTML(value, true);
    return document;
};
