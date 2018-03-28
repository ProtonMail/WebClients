// DOM element that is reused for performance reasons.
const BODY = document.createElement('BODY');
// Phone regex copied from the phone-regex npm module with added whitespace handling to prevent false matches.
const PHONE_REGEX = new RegExp('(^|\\W)((?:\\+?\\d{1,3})?[-. (]*\\d{3}[-. )]*\\d{3}[-. ]*\\d{4}(?: *x\\d+)?)($|\\W)', 'g');

/**
 * Get the text value from a text node. IE compliant.
 * @param {DOMNode} node
 * @returns {string}
 */
const getTextValue = (node) => (node.textContent ? node.textContent : node.innerText);

/**
 * Add telephone link anchor for an input string where it contains PHONE_REGEX.
 * @param {String} input
 * @returns {string}
 */
const addTelAnchor = (input = '') => input.replace(PHONE_REGEX, (match, startingWhitespace, nr, endingWhitespace) => {
    return `${startingWhitespace}<a href="tel:${nr}">${nr}</a>${endingWhitespace}`;
});

/**
 * Check and update a node. If it's an anchor tag, return false to stop traversing.
 * If it's anything other than a text node, return true to keep traversing.
 * If it is a text node that contains a phone number, set the parent's innerHTML to contain an anchor tag.
 * @param node
 * @returns {boolean}
 */
const updateNodes = (node) => {
    // Stop traversing if this is already an anchor.
    if (node.nodeName === 'A') {
        return false;
    }
    // Keep traversing until a text node is hit.
    if (node.nodeName !== '#text') {
        return true;
    }
    // Get the text value from the text node.
    const value = getTextValue(node) || '';
    // If it doesn't contain a number, ignore it.
    if (!PHONE_REGEX.test(value)) {
        return false;
    }
    // Update the HTML of the parent to contain the text + link.
    node.parentNode.innerHTML = addTelAnchor(getTextValue(node));
    return false;
};

/**
 * Traverse all children down and run the cb function.
 * @param {DOMNode} node
 * @param {Function} cb
 */
const loop = (node, cb) => {
    const children = node.childNodes;
    for (let i = 0; i < children.length; ++i) {
        const node = children[i];
        if (cb(node)) {
            loop(node, cb);
        }
    }
};

/**
 * Find if there is a phone number inside an input string (which can contain HTML).
 * Only adds a link to text nodes which are not inside an anchor tag.
 * @param  {String} input Signature
 * @return {String}
 */
const autoLink = (input = '') => {
    BODY.innerHTML = input;
    loop(BODY, updateNodes);
    return BODY.innerHTML;
};

export default autoLink;
