import { Suspense, lazy, useEffect, useMemo, useRef } from 'react';

import { c } from 'ttag';

import { buildSandboxedDoc } from './WebpageRenderer';
import type { ArtifactRendererProps } from './artifactRenderers';
import type { ParsedArtifact } from './parseArtifacts';

const SLIDES_PLACEHOLDER = '<!--SLIDES-->';

// Static shell around the model's slide markup: the library, its base stylesheet, and the theme
// are all app-bundled (see the reveal.js raw-source imports below), never model-supplied — the
// model only ever contributes inert content for the SLIDES_PLACEHOLDER slot. The combined result
// still goes through buildSandboxedDoc (same CSP/sandboxed-iframe treatment as `webpage`
// artifacts), so this adds no new network-egress surface.
//
// html/body get an explicit height: reveal.js's `embedded: true` mode (see setViewport() in
// reveal.js) deliberately skips adding its own `reveal-full-page` class to <html> — that class is
// what normally gives <html> a real height (100vh/100dvh) outside embedded mode. Without it,
// reveal.css's `.reveal { height: 100% }` has no definite ancestor height to resolve against
// (`.slides` is absolutely positioned, so it doesn't contribute to body's auto content-height
// either), so `.reveal` collapses to 0 and the deck renders as blank — confirmed live: outside
// reveal.js's own responsive scroll-view fallback (which applies its own sizing and masked this),
// `.reveal-viewport` measured a real 0px height while the surrounding iframe did not.
export function buildRevealTemplate(revealJs: string, revealCss: string, themeCss: string): string {
    return `<!DOCTYPE html>
<html>
<head>
<style>html, body { height: 100%; margin: 0; }</style>
<style>${revealCss}</style>
<style>${themeCss}</style>
</head>
<body>
<div class="reveal"><div class="slides">${SLIDES_PLACEHOLDER}</div></div>
<script>${revealJs}</script>
<script>Reveal.initialize({ embedded: true, controls: true, progress: true, center: true, hash: false });</script>
</body>
</html>`;
}

export function injectSlides(template: string, slidesHtml: string): string {
    // Replacer-function form avoids the special $&/$1/etc. substitution String.replace applies
    // to a plain string replacement — slide content is free text and could coincidentally
    // contain a literal "$1"-shaped substring (e.g. pricing).
    return template.replace(SLIDES_PLACEHOLDER, () => slidesHtml);
}

interface PresentationIframeContentProps {
    artifact: ParsedArtifact;
    revealJs: string;
    revealCss: string;
    themeCss: string;
}

function PresentationIframeContent({ artifact, revealJs, revealCss, themeCss }: PresentationIframeContentProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const template = useMemo(() => buildRevealTemplate(revealJs, revealCss, themeCss), [revealJs, revealCss, themeCss]);
    const srcDoc = useMemo(
        () => buildSandboxedDoc(injectSlides(template, artifact.content)),
        [template, artifact.content]
    );

    // Same origin-validation reasoning as WebpageRenderer: the sandboxed srcDoc has an opaque
    // origin, so event.source (tied to this specific iframe) is the only meaningful check.
    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.source !== iframeRef.current?.contentWindow) {
                return;
            }
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

    return (
        <div ref={containerRef} className="artifact-presentation-content flex-1 w-full h-full overflow-hidden">
            <iframe
                ref={iframeRef}
                title={artifact.title}
                className="w-full h-full border-none"
                sandbox="allow-scripts"
                srcDoc={srcDoc}
            />
        </div>
    );
}

// Lazy-loaded together since they're only ever used together (~176KB raw, smaller gzipped) —
// only fetched once a presentation artifact is actually opened, same pattern as the syntax
// highlighter/react-markdown lazy imports below in artifactRenderers.tsx.
const LazyPresentationIframe = lazy(() =>
    Promise.all([
        import(/* webpackChunkName: "reveal-js" */ 'reveal.js/dist/reveal.js'),
        import(/* webpackChunkName: "reveal-js" */ 'reveal.js/dist/reveal.css'),
        import(/* webpackChunkName: "reveal-js" */ 'reveal.js/dist/theme/simple.css'),
    ]).then(([{ default: revealJs }, { default: revealCss }, { default: themeCss }]) => ({
        default: ({ artifact }: ArtifactRendererProps) => (
            <PresentationIframeContent
                artifact={artifact}
                revealJs={revealJs}
                revealCss={revealCss}
                themeCss={themeCss}
            />
        ),
    }))
);

export const PresentationRenderer = ({ artifact }: ArtifactRendererProps) => {
    if (!artifact.content) {
        return <p className="color-hint text-sm p-4">{c('collider_2025:Info').t`No content generated`}</p>;
    }

    return (
        <Suspense
            fallback={
                <pre className="text-monospace text-sm m-0 p-4 overflow-auto color-norm whitespace-pre-wrap">
                    {artifact.content}
                </pre>
            }
        >
            <LazyPresentationIframe artifact={artifact} />
        </Suspense>
    );
};
