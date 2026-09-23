import { isWebKit } from '@proton/shared/lib/helpers/browser';

/**
 * Sandbox tokens applied to the composer (RoosterJS) editor iframe.
 *
 * The composer iframe is a srcless `about:blank` frame that the parent window fills via
 * `document.write` and then drives directly: RoosterJS is instantiated in the parent realm
 * and operates on a node inside the iframe, and React portals mount UI (blockquote toggle,
 * dropzone) into the iframe document. All of this requires same-origin access from the parent,
 * so `allow-same-origin` is mandatory.
 *
 * No script executes *inside* the iframe on its own: the editor logic runs in the parent and
 * `contentEditable` is a native browser feature. We therefore intentionally omit `allow-scripts`.
 * This prevents a nested browsing context injected into quoted/edited content (e.g.
 * `<iframe srcdoc>`) from executing as same-origin JavaScript, which was the pivot used to run
 * a decrypted attachment blob as a script in the Mail origin.
 *
 * WebKit is the exception: it does not invoke parent-registered event listeners on nodes of a
 * sandboxed frame without `allow-scripts`. Without it, RoosterJS never receives input events,
 * the model is never updated and the typed content is silently lost on send. This applies to
 * the WebKit *engine*, not only to Safari: every iOS browser (Chrome, Firefox, Edge...) and
 * in-app webviews (Gmail, Outlook...) are affected, hence the engine check rather than a
 * browser name check.
 */
export const getComposerIframeSandbox = () =>
    [
        // Required: the parent must be able to write to and manipulate the frame document.
        'allow-same-origin',
        // Allow target="_blank" links in the edited content to open, matching the reading pane.
        'allow-popups',
        // Opened links escape the sandbox so they behave as normal pages, not sandboxed frames.
        'allow-popups-to-escape-sandbox',
        // WebKit-only: parent-registered listeners and portals over a sandboxed same-origin child
        // require this. Other engines work without it, keeping the frame non-scriptable.
        ...(isWebKit() ? ['allow-scripts'] : []),
    ].join(' ');
