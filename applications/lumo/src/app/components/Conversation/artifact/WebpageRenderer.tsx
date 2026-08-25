import { useMemo } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';

import type { ArtifactRendererProps } from './artifactRenderers';
import { useArtifactShellIframe } from './useArtifactShellIframe';

/**
 * Script injected into the artifact document so we can cross the iframe boundary. The parent
 * posts { type: 'lumo-resize' } via postMessage, and this listener re-dispatches a native resize
 * event so canvas/D3/etc. recalculate. It also forwards runtime errors back to the parent.
 */
const BRIDGE_SCRIPT_BODY = `
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'lumo-resize') {
    window.dispatchEvent(new Event('resize'));
  }
});
window.onerror = function(msg, _src, line, col) {
  window.parent.postMessage({ type: 'lumo-webpage-error', message: String(msg), line: line, col: col }, '*');
  return false;
};
window.addEventListener('unhandledrejection', function(e) {
  var msg = e.reason ? String(e.reason) : 'Unhandled promise rejection';
  window.parent.postMessage({ type: 'lumo-webpage-error', message: msg }, '*');
});
`;

// Parses `html` into a real Document (DOMParser never executes <script> elements, so this is safe
// on untrusted content) rather than regex-matching the raw string, and appends the resize/error
// bridge script to <head>. Unlike the old srcDoc approach, no CSP <meta> is injected here anymore
// — the artifact shell route now sets its own Content-Security-Policy response header (a real
// HTTP response is not subject to the old srcDoc CSP-inheritance bug), so the header is the single
// source of truth for the policy instead of a meta tag baked into this string.
export function buildArtifactDocument(html: string): string {
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const script = doc.createElement('script');
    script.textContent = BRIDGE_SCRIPT_BODY;
    doc.head.appendChild(script);

    const doctype = doc.doctype ? `<!DOCTYPE ${doc.doctype.name}>` : '';
    return doctype + doc.documentElement.outerHTML;
}

export const WebpageRenderer = ({ artifact }: ArtifactRendererProps) => {
    const document = useMemo(
        () => (artifact.content ? buildArtifactDocument(artifact.content) : null),
        [artifact.content]
    );
    const { iframeRef, containerRef, shellSrc, onIframeLoad, ready } = useArtifactShellIframe(document);

    if (!artifact.content) {
        return <p className="color-hint text-sm p-4">{c('collider_2025:Info').t`No content generated`}</p>;
    }

    return (
        <div ref={containerRef} className="artifact-webpage-content relative flex-1 w-full h-full overflow-hidden">
            {!ready && (
                <div className="absolute inset-center">
                    <CircleLoader size="medium" />
                </div>
            )}
            {/*
                allow-same-origin is required here so the iframe keeps its real, distinct origin
                (the shell's own lumo-api origin) instead of being forced to an opaque "null" origin
                — without it, postMessage's targetOrigin check in useArtifactShellIframe can never
                match and the handshake silently fails. This is safe: unlike the old srcDoc/blob:
                approach (where allow-same-origin would have granted the LLM-authored content
                Lumo's own origin — see DESIGN.md), the shell is now loaded from a genuinely
                different origin than the Lumo app, so allow-same-origin only unlocks that already-
                distinct origin — it does not grant access to Lumo's own cookies/storage.
            */}
            <iframe
                ref={iframeRef}
                title={artifact.title}
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-same-origin"
                src={shellSrc}
                onLoad={onIframeLoad}
            />
        </div>
    );
};
