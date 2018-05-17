import juice from 'juice/client';

const OPTIONS = {
    applyAttributesTableElements: false
};

/**
 * Iterates through all parent nodes (including current), comparing against cb.
 * @param {DOMNode} node
 * @param {Function} cb
 * @returns {*}
 */
// eslint-disable-next-line import/prefer-default-export
export const findParent = (node, cb) => {
    let traverse = node;
    if (traverse && cb(traverse)) {
        return traverse;
    }
    while (traverse.parentNode) {
        traverse = traverse.parentNode;
        if (cb(traverse)) {
            return traverse;
        }
    }
};

/**
 * Inline css into an element.
 * @param {String} html
 * @returns {String}
 */
export const inlineCss = (html = '') => juice(html, OPTIONS);

/**
 * Set an element to be hidden.
 * @param {DOMNode} el
 * @param {Boolean} value Hidden or shown
 */
export const setHidden = (el, value = false) => {
    el.style.display = value ? 'none' : '';
};
