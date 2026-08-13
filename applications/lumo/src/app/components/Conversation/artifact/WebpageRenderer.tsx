import { useEffect, useMemo, useRef } from 'react';

import { c } from 'ttag';

import type { ArtifactRendererProps } from './artifactRenderers';

/**
 * Blocks all network egress from the rendered page (fetch/XHR/WebSocket/EventSource via
 * connect-src, remote scripts/stylesheets/frames/forms via the other 'none'/inline-only
 * directives) while still allowing the artifact's own inline <script>/<style> to run — that
 * inline execution is the entire point of this artifact type. img/font/media are restricted to
 * data:/blob: so no remote asset fetch is possible either. This is injected into the srcDoc
 * itself because a page-level CSP does not apply to a sandboxed, opaque-origin srcDoc iframe.
 */
const CSP_META = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none';">`;

/**
 * Script injected into the srcDoc so we can cross the sandboxed iframe's opaque-origin boundary.
 * The parent posts { type: 'lumo-resize' } via postMessage (the only API that works across a
 * sandboxed iframe origin), and this listener re-dispatches a native resize event so
 * canvas/D3/etc. recalculate. It also forwards runtime errors back to the parent.
 */
const INJECTED_SCRIPT = `<script>
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
</script>`;

function buildSandboxedDoc(html: string): string {
    const withScript = /<\/head>/i.test(html)
        ? html.replace(/<\/head>/i, `${INJECTED_SCRIPT}</head>`)
        : INJECTED_SCRIPT + html;
    return /<head[^>]*>/i.test(withScript)
        ? withScript.replace(/<head([^>]*)>/i, `<head$1>${CSP_META}`)
        : CSP_META + withScript;
}

export const WebpageRenderer = ({ artifact }: ArtifactRendererProps) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const srcDoc = useMemo(() => buildSandboxedDoc(artifact.content), [artifact.content]);

    // Validate against the specific iframe's contentWindow rather than event.origin — the
    // sandboxed srcDoc has an opaque origin, so event.origin is the unhelpful literal string
    // "null" and can't be compared meaningfully. Tying trust to event.source instead means a
    // message can only be accepted if it actually came from this iframe, not forged by any
    // other script sharing the page (which would otherwise be a route to feed fabricated
    // "runtime errors" back into the conversation).
    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.source !== iframeRef.current?.contentWindow) {
                return;
            }
            // Runtime errors are not currently surfaced in the UI for webpage artifacts; the
            // listener still validates origin so nothing forged elsewhere on the page is acted on.
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        let debounceTimer: ReturnType<typeof setTimeout> | null = null;

        const observer = new ResizeObserver(() => {
            if (debounceTimer !== null) {
                clearTimeout(debounceTimer);
            }
            debounceTimer = setTimeout(() => {
                iframeRef.current?.contentWindow?.postMessage({ type: 'lumo-resize' }, '*');
            }, 200);
        });

        observer.observe(container);
        return () => {
            observer.disconnect();
            if (debounceTimer !== null) {
                clearTimeout(debounceTimer);
            }
        };
    }, []);

    if (!artifact.content) {
        return <p className="color-hint text-sm p-4">{c('collider_2025:Info').t`No content generated`}</p>;
    }

    return (
        <div ref={containerRef} className="artifact-webpage-content flex-1 w-full h-full overflow-hidden">
            <iframe
                ref={iframeRef}
                title={artifact.title}
                className="w-full h-full border-none"
                sandbox="allow-scripts"
                srcDoc={srcDoc}
            />
        </div>
    );
};
