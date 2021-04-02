import { protonizer as purifyHTML } from 'proton-shared/lib/sanitize';
import { uniqID } from '../string';
import { Base64Cache } from '../../hooks/useBase64Cache';
import { inlineCss } from '../dom';

/**
 * Parsing base64 is expensive and can create a crash.
 * Here we can reduce input string from many Mb to less than 100kb, which is way easier to escape.
 * So instead of escaping everything with it too, we remove them from the HTML
 * and we replace it with an attribute with an uniq hash so we can load them
 * later for the user via injectMessageMedia component.
 * Store it inside inside a cache
 *     - lazy load the image post render message
 *     - open the composer we need to lazy load it here too
 *
 * Source: regexp https://www.regextester.com/95505
 * @param input Raw unescaped HTML
 */
const removeBase64 = (input: string, cache?: Base64Cache): string => {
    /* eslint no-useless-escape: "off" */
    return input.replace(/src="data:image\/([a-zA-Z]*);base64,([^\"]*)\"/g, (match) => {
        const hash = uniqID();
        if (cache) {
            cache.set(hash, match);
        }
        return `data-proton-replace-base="${hash}"`;
    });
};

/**
 * Parse the dom and find all matching base64 custom tags we added
 * then replace them by the valid SRC for the base64.
 * @return HTML
 */
export const attachBase64 = (element: Element, cache: Base64Cache) => {
    const nodes = [...element.querySelectorAll('[data-proton-replace-base]')];
    nodes.forEach((node) => {
        const hash = node.getAttribute('data-proton-replace-base');

        // Clean the string and remove \n else it won't load inside the browser
        const src = (cache.get(hash || '') || '')
            .replace(/^src="/, '')
            .replace(/"$/, '')
            .replace(/\n/, '');
        if (src) {
            node.setAttribute('src', src);
        }
        node.removeAttribute('data-proton-replace-base');
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
    const value = removeBase64(content, cache);
    const document = purifyHTML(value, true);
    inlineCss(document);
    return document;
};
