import { useEffect, useMemo, useRef, useState } from 'react';

import { ARTIFACT_HTML_MESSAGE, ARTIFACT_RESIZE_MESSAGE, getArtifactShellUrl } from './artifactShell';

interface UseArtifactShellIframeResult {
    iframeRef: React.RefObject<HTMLIFrameElement>;
    containerRef: React.RefObject<HTMLDivElement>;
    shellSrc: string;
    onIframeLoad: () => void;
    ready: boolean;
}

/**
 * Loads the static artifact shell via `iframe.src` (a real cross-origin HTTP response, with its
 * own CSP header) and hands the artifact's HTML to it over postMessage once it's loaded — see
 * ARTIFACT_SHELL_PROPOSAL.md. Shared by WebpageRenderer and PresentationRenderer.
 *
 * Readiness is driven by the iframe's native `onLoad` event, not a child-initiated postMessage
 * handshake. The shell's inline bootstrap script runs synchronously during parsing, before `load`
 * fires, so by the time `onLoad` fires its message listener is already registered — we don't need
 * the shell to tell us that itself. This mirrors the existing Chargebee payment iframe
 * (`packages/payments/ui/components/ChargebeeIframe.tsx`), which uses the same `onLoad`-then-post
 * pattern for a real cross-origin iframe. It also sidesteps a genuinely fragile mechanism: an
 * earlier version of the shell tried to resolve its own parent's origin from `document.referrer`
 * before posting a "ready" ping, which broke across environments in a few different ways (a
 * hardcoded prod origin, a `frame-ancestors` CSP list missing the dev origin) before we dropped
 * the dependency on it entirely.
 *
 * `loadGeneration` (rather than a plain ready boolean) tracks every `load` event, not just the
 * first — if the shell iframe ever reloads on its own, this makes sure the current `html` gets
 * re-delivered instead of silently going stale.
 */
export function useArtifactShellIframe(html: string | null): UseArtifactShellIframeResult {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [loadGeneration, setLoadGeneration] = useState(0);
    // Mirrors loadGeneration > 0 for the ResizeObserver's closure below, so the resize bridge
    // doesn't try to postMessage the iframe before it has actually navigated to the shell — until
    // then the iframe (with allow-same-origin) is still on about:blank, which inherits Lumo's own
    // origin rather than the shell's, so a premature postMessage there always fails the
    // targetOrigin check.
    const loadedRef = useRef(false);

    const shellUrl = useMemo(() => getArtifactShellUrl(), []);
    const shellSrc = shellUrl.toString();
    const shellOrigin = shellUrl.origin;

    const onIframeLoad = () => {
        console.log('[artifact-shell] onLoad fired (build marker: onload-v1)', { shellSrc, shellOrigin });
        loadedRef.current = true;
        setLoadGeneration((generation) => generation + 1);
    };

    useEffect(() => {
        if (loadGeneration === 0 || html === null) {
            return;
        }
        try {
            iframeRef.current?.contentWindow?.postMessage({ type: ARTIFACT_HTML_MESSAGE, html }, shellOrigin);
        } catch (error) {
            console.error('[artifact-shell] postMessage to iframe failed', error);
        }
    }, [loadGeneration, html, shellOrigin]);

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
                if (!loadedRef.current) {
                    return;
                }
                try {
                    iframeRef.current?.contentWindow?.postMessage({ type: ARTIFACT_RESIZE_MESSAGE }, shellOrigin);
                } catch (error) {
                    console.error('[artifact-shell] resize postMessage failed', error);
                }
            }, 200);
        });

        observer.observe(container);
        return () => {
            observer.disconnect();
            if (debounceTimer !== null) {
                clearTimeout(debounceTimer);
            }
        };
    }, [shellOrigin]);

    return { iframeRef, containerRef, shellSrc, onIframeLoad, ready: loadGeneration > 0 };
}
