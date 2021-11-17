import { IMG_SRC_BASE_64_PREFIX } from './transformEscape';

const ELEMENTS = [
    {
        selector: 'a:not([href^="http"]):not([href^="mailto:"])',
        attribute: 'href',
    },
    {
        selector: `img:not([src^="http"]):not([proton-src^="cid"]):not([${IMG_SRC_BASE_64_PREFIX}])`,
        attribute: 'src',
    },
];

const getBaseURL = (base: HTMLBaseElement) => {
    // Make sure base has trailing slash
    const baseUrl = base.getAttribute('href') || '';
    if (baseUrl.substr(-1, 1) !== '/') {
        return `${baseUrl}/`;
    }
    return baseUrl;
};

/**
 * Append base url to any href/src if we need to
 * @param   html HTML document from DOMPurify
 * @return      Dom based
 */
export const transformBase = (document: Element) => {
    const base = document.querySelector('base');

    if (!base || !base.getAttribute('href')) {
        return { document };
    }

    // Make sure base has trailing slash
    const BASE_URL = getBaseURL(base);

    const bindAttribute = (node: Element, key: string, value = '') => {
        if (!value.startsWith('http')) {
            node.setAttribute(key, BASE_URL + value);
        }
    };

    ELEMENTS.forEach(({ selector, attribute }) => {
        [...document.querySelectorAll(selector)].forEach((el) => {
            const keyproton = `proton-${attribute}`;
            const value = el.getAttribute(attribute) || '';
            const ptValue = el.getAttribute(keyproton) || '';
            // Ensure we don't add a useless / if we already have one
            const url = value.charAt(0) === '/' ? value.slice(1) : value;

            /*
                Bind the value only when we need, if there is a proton-src we don't need
                to add the src else it will generate a request to the domain
             */
            if (ptValue || (attribute === 'src' && !value)) {
                bindAttribute(el, keyproton, ptValue);
            } else {
                bindAttribute(el, attribute, url);
            }
        });
    });

    // Remove base element, even if there are several
    document.querySelectorAll('base').forEach((base) => {
        base.parentElement?.removeChild(base);
    });
};
