/**
 * Nested anchors should be invalid, but we can receive emails with links nested links.
 * This is making inner links not working (it will trigger a onClick on the parent).
 * To fix this, we want to replace broken anchors with a span, so that inner links are clickable.
 *
 * To do so, we need to search for all anchors tags which have an id attribute and no href,
 * AND which have as children a link with a href.
 * If found, then we replace the parent link with a span, since we want to use it as a anchor (jump) link.
 */
export const transformAnchors = (inputDocument: Element) => {
    // Search for all anchors with an id and no href
    inputDocument.querySelectorAll('a[id]:not([href])').forEach((anchor) => {
        // Check if the anchor has an anchor child
        const hasChildAnchors = anchor.querySelectorAll('a[href]').length > 0;

        // If found, then we want to replace the anchor with a span
        if (hasChildAnchors) {
            const span = document.createElement('span');

            for (const attr of anchor.attributes) {
                span.setAttribute(attr.name, attr.value);
            }

            span.innerHTML = anchor.innerHTML;

            anchor.replaceWith(span);
        }
    });
};
