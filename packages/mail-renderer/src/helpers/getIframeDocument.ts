/**
 * Read an iframe document, or null if it is not same-origin.
 *
 *
 * A frame that has navigated away from the document to another origin, or to an error page on an opaque origin
 * is no longer reachable. `contentWindow` stays non-null in that state so optional chaining does not guard
 * the access and `contentWindow.document` throws. `contentDocument` returns null instead in such cases.
 */
export const getIframeDocument = (iframe: HTMLIFrameElement | null | undefined): Document | null => {
    try {
        return iframe?.contentDocument ?? null;
    } catch {
        return null;
    }
};
