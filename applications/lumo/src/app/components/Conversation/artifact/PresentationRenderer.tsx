import { Suspense, lazy, memo, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';

import { looksLikeDeckJson } from '../../../util/slides/deckContent';
import { ArtifactShellSourceFallback } from './ArtifactShellSourceFallback';
import { DeckPreview } from './DeckPreview';
import { buildArtifactDocument } from './WebpageRenderer';
import type { ArtifactRendererProps } from './artifactRenderers';
import type { ParsedArtifact } from './parseArtifacts';
import { renderChartsInSlideContent, slideContentNeedsChartPass } from './presentationCharts';
import { buildRevealTemplate, injectSlides } from './revealTemplate';
import { useArtifactShellIframe } from './useArtifactShellIframe';

interface PresentationIframeContentProps {
    artifact: ParsedArtifact;
    revealJs: string;
    revealCss: string;
    themeCss: string;
}

const PresentationIframeContent = memo(function PresentationIframeContent({
    artifact,
    revealJs,
    revealCss,
    themeCss,
}: PresentationIframeContentProps) {
    // Chart placeholders (see presentationCharts.ts) need an async pre-render pass to swap them
    // for inert SVG before the deck is templated into the sandboxed iframe. Most decks have no
    // charts, so that pass is skipped entirely (synchronous passthrough) rather than always paying
    // an async hop.
    const [processedContent, setProcessedContent] = useState<string | null>(null);

    useEffect(() => {
        if (!slideContentNeedsChartPass(artifact.content)) {
            setProcessedContent(artifact.content);
            return;
        }

        setProcessedContent(null);
        let cancelled = false;
        void renderChartsInSlideContent(artifact.content).then((rendered) => {
            if (!cancelled) {
                setProcessedContent(rendered);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [artifact.content]);

    const template = useMemo(() => buildRevealTemplate(revealJs, revealCss, themeCss), [revealJs, revealCss, themeCss]);
    const document = useMemo(() => {
        if (processedContent === null) {
            return null;
        }
        return buildArtifactDocument(injectSlides(template, processedContent));
    }, [template, processedContent]);

    const { iframeRef, containerRef, shellSrc, onIframeLoad, ready, isCrossOrigin, shellMountKey } =
        useArtifactShellIframe(document);

    if (document === null) {
        return <ArtifactShellSourceFallback content={artifact.content} />;
    }

    if (!isCrossOrigin) {
        return <ArtifactShellSourceFallback content={artifact.content} />;
    }

    return (
        <div
            ref={containerRef}
            className="artifact-presentation-content relative flex-1 min-h-0 min-w-0 w-full h-full overflow-hidden"
        >
            {!ready && (
                <div className="absolute inset-center">
                    <CircleLoader size="medium" />
                </div>
            )}
            {/* allow-same-origin: see WebpageRenderer — only used when isCrossOrigin is true. */}
            <iframe
                key={shellMountKey}
                ref={iframeRef}
                title={artifact.title}
                className="w-full h-full border-none"
                sandbox="allow-scripts allow-same-origin"
                src={shellSrc}
                onLoad={onIframeLoad}
            />
        </div>
    );
});

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

export const PresentationRenderer = memo(function PresentationRenderer({ artifact }: ArtifactRendererProps) {
    if (!artifact.content) {
        return <p className="color-hint text-sm p-4">{c('collider_2025:Info').t`No content generated`}</p>;
    }

    // JSON decks (D18) are drawn by the app itself; reveal.js and the sandboxed shell are only for
    // HTML decks made before them or with `LumoArtifactSlides` off.
    if (looksLikeDeckJson(artifact.content)) {
        return <DeckPreview artifact={artifact} />;
    }

    return (
        <Suspense fallback={<ArtifactShellSourceFallback content={artifact.content} />}>
            <LazyPresentationIframe artifact={artifact} />
        </Suspense>
    );
});
