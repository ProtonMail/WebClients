import { uniqID } from '../string';
import { protonizer as purifyHTML } from 'proton-shared/lib/sanitize';
import { parseInDiv } from '../dom';

import { Base64Cache } from '../../hooks/useBase64Cache';

/*
 * match attributes or elements with svg, xlink, srcset, src, background, poster.
 * the regex checks that the element/attribute is actually in an element by looking forward and seeing if it
 * ends properly with a >
 *
 * Another assumption in these regex are: all attributes use the " quotes instead of the ' quote. This is satisfied
 * by the previous standardization steps
 */
const SVG_LIST = ['svg'];
const FORBIDDEN_SVG = `(${SVG_LIST.join('|')})`;
const NO_SPECIALS = '([^"><\\\\]|\\\\[^><])';
const NO_QUOTS = '(\\\\.|[^"\\\\])';
const HTML_STRING = `("${NO_QUOTS}*")`;
const VERIFY_ELEMENT_END = `(?=(${NO_SPECIALS}|${HTML_STRING})*>)`;
const VERIFY_UNIQUE = '([^-])';

// Ensure that the forbidden attributes are not already escaped with proton- by checking that there is no '-' character in front of them.
const REGEXP_SVG_BREAK = new RegExp(VERIFY_UNIQUE + FORBIDDEN_SVG + VERIFY_ELEMENT_END, 'gi');

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
        cache && cache.set(hash, match);
        return `data-proton-replace-base="${hash}"`;
    });
};

/**
 * Parse the dom and find all matching base64 custom tags we added
 * then replace them by the valid SRC for the base64.
 * @return HTML
 */
export const attachBase64Parser = (node: Element, cache: Base64Cache): string => {
    const nodes = [...node.querySelectorAll('[data-proton-replace-base]')];
    nodes.forEach((node) => {
        const hash = node.getAttribute('data-proton-replace-base');

        // Clean the string and remove \n else it won't load inside the browser
        const src = (cache.get(hash || '') || '')
            .replace(/^src="/, '')
            .replace(/"$/, '')
            .replace(/\n/, '');
        src && node.setAttribute('src', src);
        node.removeAttribute('data-proton-replace-base');
    });
    return node.innerHTML;
};

/**
 * Attach escaped base64 to the dom if the input is a txt
 * @param input HTML
 * @param cache
 * @return HTML
 */
export const attachBase64 = (input: string, cache: Base64Cache): string => {
    const div = parseInDiv(input);
    return attachBase64Parser(div, cache);
};

const escapeSVG = (input = '') => input.replace(REGEXP_SVG_BREAK, '$1proton-$2');

/**
 * Escape content for a message
 * Content can be a Document when we open a message, it's useful
 * in order to bind the base if it exists
 * @param message Message to escape
 * @param action Type of action
 */
export const transformEscape = (content = '', cache?: Base64Cache) => {
    const value = removeBase64(content, cache);
    const activeHooks = true; // action !== 'user.inject';
    const document = purifyHTML(escapeSVG(value), activeHooks) as Element;
    return document;
};
