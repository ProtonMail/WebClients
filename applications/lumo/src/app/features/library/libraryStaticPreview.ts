import type { ArtifactType } from '../../components/Conversation/artifact/parseArtifacts';

/**
 * Library previews never run the artifact's scripts. Unlike the panel, where a page runs only when
 * the user opens it, the Library would otherwise run every stored page as it scrolls into view.
 * Inside the shell a script can still navigate its own frame away with the artifact's text in the
 * URL (CSP can't stop that), and a runaway loop would freeze Lumo's tab (the shell is the same
 * site, so likely the same process).
 *
 * The guarantee is the CSP meta tag: a policy only ever adds restrictions on top of the shell's
 * header, and it holds for a document the shell document.write()s (checked in Chrome 155: inline
 * scripts and inline handlers both blocked). Dropping <script> elements and on* attributes as well
 * covers a browser that would not apply a meta policy there.
 */
export const STATIC_PREVIEW_CSP = "script-src 'none'";

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

    for (const script of Array.from(doc.querySelectorAll('script'))) {
        script.remove();
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
