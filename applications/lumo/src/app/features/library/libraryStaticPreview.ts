import type { ArtifactType } from '../../components/Conversation/artifact/parseArtifacts';

/**
 * Library previews never run the artifact's scripts or load anything over the network. Unlike the
 * panel, where a page runs only when the user opens it, the Library would otherwise run every
 * stored page as it scrolls into view, on every device. Inside the shell a script can still
 * navigate its own frame away with the artifact's text in the URL (CSP can't stop that), and a
 * runaway loop would freeze Lumo's tab (the shell is the same site, so likely the same process).
 * Remote images, stylesheets, fonts and frames would likewise send a request each time a card is
 * shown, which an injected page could use as a beacon. Generated pages are meant to be
 * self-contained (see createArtifactTool), so a legitimate preview loses nothing.
 *
 * The guarantee is the CSP meta tag: a policy only ever adds restrictions on top of the shell's
 * header, and it holds for a document the shell document.write()s (checked in Chrome 155: inline
 * scripts and inline handlers both blocked). Dropping <script> elements and on* attributes as well
 * covers a browser that would not apply a meta policy there. A meta refresh and DNS prefetching
 * are outside CSP entirely, so those elements are always dropped.
 */
export const STATIC_PREVIEW_CSP = [
    // Anything without its own directive below: fetch, frames, media, objects, workers.
    "default-src 'none'",
    "script-src 'none'",
    // Inline <style> and style="" only; no remote sheets or @import.
    "style-src 'unsafe-inline'",
    'img-src data: blob:',
    'font-src data:',
    // Neither falls back to default-src.
    "base-uri 'none'",
    "form-action 'none'",
].join('; ');

// Elements that run code, navigate the frame, or load or embed another document. Every <link> goes,
// since stylesheets are blocked by the policy anyway and dns-prefetch/preconnect escape it.
const BLOCKED_ELEMENTS = 'script, meta[http-equiv="refresh" i], link, base, iframe, frame, object, embed';

// Without reveal.js running, every slide stays display:none. Show the first one, laid out as a
// plain block, so a deck's preview is its title slide.
const STATIC_DECK_STYLE = `
.reveal .slides > section:first-of-type {
  display: block !important;
  position: relative !important;
  top: 0 !important;
  padding: 48px 64px !important;
  box-sizing: border-box;
}
.reveal, .reveal .slides { position: relative !important; inset: auto !important; transform: none !important; }
.reveal .controls, .reveal .progress { display: none !important; }
`;

export function buildStaticPreviewDocument(html: string, type: ArtifactType): string {
    // DOMParser never runs scripts, so parsing untrusted HTML here is safe.
    const doc = new DOMParser().parseFromString(html, 'text/html');

    for (const element of Array.from(doc.querySelectorAll(BLOCKED_ELEMENTS))) {
        element.remove();
    }
    for (const element of Array.from(doc.querySelectorAll('*'))) {
        for (const attribute of Array.from(element.attributes)) {
            if (attribute.name.toLowerCase().startsWith('on')) {
                element.removeAttribute(attribute.name);
            }
        }
    }

    if (type === 'presentation') {
        const style = doc.createElement('style');
        style.textContent = STATIC_DECK_STYLE;
        doc.head.appendChild(style);
    }

    // First in <head>, so it is in force before anything else in the document is parsed.
    const policy = doc.createElement('meta');
    policy.setAttribute('http-equiv', 'Content-Security-Policy');
    policy.setAttribute('content', STATIC_PREVIEW_CSP);
    doc.head.prepend(policy);

    const doctype = doc.doctype ? `<!DOCTYPE ${doc.doctype.name}>` : '';
    return doctype + doc.documentElement.outerHTML;
}
