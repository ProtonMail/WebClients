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

export const inlineCss = (html = '') => juice(html, OPTIONS);
