import { filterAllowedMatches, linkifyInstance } from '@proton/shared/lib/mail/linkifyInstance';

// Tags whose text content must never be linkified — either because doing so
// would nest <a> tags, or because the content is meant to be rendered verbatim.
const SKIP_ANCESTORS = new Set(['A', 'SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'NOSCRIPT']);

const hasSkippedAncestor = (node: Node, root: Element) => {
    let current: Node | null = node.parentNode;
    while (current && current !== root) {
        if (current.nodeType === Node.ELEMENT_NODE && SKIP_ANCESTORS.has((current as Element).tagName)) {
            return true;
        }
        current = current.parentNode;
    }
    return false;
};

/**
 * Wrap raw URLs found in text nodes of an HTML email body with <a> tags.
 *
 * HTML messages reach the renderer with whatever markup the sender produced,
 * which often includes URLs sitting in plain text nodes. transformLinks only
 * post-processes existing anchors, so without this pass those URLs render as
 * non-clickable text. We walk text nodes ourselves rather than touching
 * innerHTML to avoid re-parsing untrusted content.
 *
 * Anchors created here only carry an `href`. Target and rel are applied by the
 * subsequent transformLinks pass, which then treats them like any other anchor.
 */
export const transformRawLinks = (document: Element) => {
    const doc = document.ownerDocument;
    if (!doc) {
        return;
    }

    const walker = doc.createTreeWalker(document, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
            const text = node.nodeValue;
            if (!text || !text.trim()) {
                return NodeFilter.FILTER_REJECT;
            }
            if (hasSkippedAncestor(node, document)) {
                return NodeFilter.FILTER_REJECT;
            }
            return linkifyInstance.test(text) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        },
    });

    // Collect first, then mutate — replacing nodes during traversal would
    // invalidate the walker's current position.
    const textNodes: Text[] = [];
    for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
        textNodes.push(node as Text);
    }

    textNodes.forEach((textNode) => {
        const content = textNode.nodeValue ?? '';
        const matches = filterAllowedMatches(linkifyInstance.match(content));
        if (matches.length === 0) {
            return;
        }

        const fragment = doc.createDocumentFragment();
        let cursor = 0;

        matches.forEach((match) => {
            if (cursor < match.index) {
                fragment.appendChild(doc.createTextNode(content.slice(cursor, match.index)));
            }

            const anchor = doc.createElement('a');
            anchor.setAttribute('href', match.url);
            anchor.textContent = match.text;
            fragment.appendChild(anchor);

            cursor = match.lastIndex;
        });

        if (cursor < content.length) {
            fragment.appendChild(doc.createTextNode(content.slice(cursor)));
        }

        textNode.parentNode?.replaceChild(fragment, textNode);
    });
};
