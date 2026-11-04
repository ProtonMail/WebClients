import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';

import { DeckSlide } from '../../components/Conversation/artifact/DeckSlide';
import { isArtifactShellCrossOrigin } from '../../components/Conversation/artifact/artifactShell';
import { ARTIFACT_TYPE_CONFIG } from '../../components/Conversation/artifact/artifactTypeConfig';
import type { ArtifactType } from '../../components/Conversation/artifact/parseArtifacts';
import { useArtifactShellIframe } from '../../components/Conversation/artifact/useArtifactShellIframe';
import { useLumoTheme } from '../../providers';
import { looksLikeDeckJson, readDeckContent } from '../../util/slides/deckContent';
import { layoutDeck } from '../../util/slides/layoutDeck';
import { buildStaticPreviewDocument } from './libraryStaticPreview';

const LibraryCodeThumbnailHighlighter = lazy(() => import('./LibraryCodeThumbnailHighlighter'));

// Code thumbnails show the start of the file, like an editor scrolled to the top.
const CODE_PREVIEW_LINES = 9;
// Webpages and decks render at a desktop size, then scale down to the card.
const HTML_RENDER_WIDTH = 1280;
// Widths of the abstract text lines on a document thumbnail.
const DOCUMENT_LINE_WIDTHS = ['100%', '95%', '86%', '98%', '70%', '100%', '90%'];

interface DocumentThumbnailProps {
    title: string;
    subtitle?: string;
}

const DocumentThumbnail = ({ title, subtitle }: DocumentThumbnailProps) => {
    return (
        <div className="flex flex-column flex-nowrap gap-1 h-full p-6 bg-norm overflow-hidden">
            <span className="text-lg text-bold color-norm text-ellipsis">{title}</span>
            {subtitle && <span className="text-xs color-hint text-ellipsis">{subtitle}</span>}
            <div className="flex flex-column gap-2 mt-4" aria-hidden="true">
                {DOCUMENT_LINE_WIDTHS.map((width, index) => {
                    return (
                        <span
                            key={index}
                            className="library-thumbnail-line block rounded-full h-custom w-custom"
                            style={{ '--w-custom': width, '--h-custom': '0.375rem' }}
                        />
                    );
                })}
            </div>
        </div>
    );
};

interface PlainCodeLinesProps {
    lines: string[];
}

// Shown until the highlighter chunk loads, laid out like it so the swap doesn't shift anything.
const PlainCodeLines = ({ lines }: PlainCodeLinesProps) => {
    return (
        <>
            {lines.map((line, index) => {
                return (
                    <div key={index} className="flex flex-row flex-nowrap text-pre">
                        <span
                            className="shrink-0 color-hint text-right w-custom pr-4"
                            style={{ '--w-custom': '2.25rem' }}
                        >
                            {index + 1}
                        </span>
                        <span className="color-norm">{line}</span>
                    </div>
                );
            })}
        </>
    );
};

interface CodeThumbnailProps {
    content: string;
    language?: string;
}

const CodeThumbnail = ({ content, language }: CodeThumbnailProps) => {
    const { theme } = useLumoTheme();
    // Only the lines that fit are highlighted, so a long file costs the same as a short one.
    const lines = useMemo(() => {
        return content.split('\n', CODE_PREVIEW_LINES);
    }, [content]);
    return (
        <div className="h-full p-4 bg-weak overflow-hidden text-xs text-monospace" aria-hidden="true">
            <Suspense fallback={<PlainCodeLines lines={lines} />}>
                <LibraryCodeThumbnailHighlighter code={lines.join('\n')} language={language ?? 'text'} theme={theme} />
            </Suspense>
        </div>
    );
};

interface TypeIconThumbnailProps {
    type: ArtifactType;
}

const TypeIconThumbnail = ({ type }: TypeIconThumbnailProps) => {
    const Icon = ARTIFACT_TYPE_CONFIG[type].icon;
    return (
        <div className="flex items-center justify-center h-full bg-weak color-weak" aria-hidden="true">
            <Icon size={8} />
        </div>
    );
};

interface HtmlThumbnailFrameProps {
    type: ArtifactType;
    html: string;
    title: string;
    scale: number;
    renderHeight: number;
}

/**
 * The shell iframe itself. Mounted and unmounted as a whole with visibility, so each mount starts
 * with fresh shell state (no stale "ready" from a previous iframe) and its resize bridge attaches.
 */
const HtmlThumbnailFrame = ({ type, html, title, scale, renderHeight }: HtmlThumbnailFrameProps) => {
    const document = useMemo(() => {
        return buildStaticPreviewDocument(html, type);
    }, [html, type]);
    const { iframeRef, containerRef, shellSrc, onIframeLoad, ready, shellMountKey } = useArtifactShellIframe(document);

    return (
        <div
            ref={containerRef}
            className="absolute top-0 left-0 w-custom h-custom"
            style={{
                '--w-custom': `${HTML_RENDER_WIDTH}px`,
                '--h-custom': `${renderHeight}px`,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                opacity: ready ? 1 : 0,
            }}
        >
            <iframe
                key={shellMountKey}
                ref={iframeRef}
                title={title}
                className="w-full h-full border-none pointer-events-none"
                // allow-scripts is for the shell's own message listener; the artifact's scripts are
                // blocked by the policy in buildStaticPreviewDocument.
                sandbox="allow-scripts allow-same-origin"
                src={shellSrc}
                onLoad={onIframeLoad}
                tabIndex={-1}
            />
        </div>
    );
};

interface HtmlThumbnailProps {
    type: ArtifactType;
    html: string;
    title: string;
}

/**
 * A static render (no scripts, see libraryStaticPreview) of a webpage or deck through the same
 * cross-origin artifact shell as the panel, scaled down and inert. The iframe only exists while the card is on or near the screen, so a
 * long library never holds more pages than are visible.
 *
 * A deck's synced asset is already the full standalone deck (reveal.js inlined, charts rendered
 * to SVG; see buildStandalonePresentationHtml); without scripts it previews its first slide.
 */
const HtmlThumbnail = ({ type, html, title }: HtmlThumbnailProps) => {
    const frameRef = useRef<HTMLDivElement>(null);
    const [isNearViewport, setIsNearViewport] = useState(false);
    // How much to shrink the desktop-size render, and how tall it must be to fill the card.
    const [frame, setFrame] = useState({ scale: 0, renderHeight: 0 });

    useEffect(() => {
        const element = frameRef.current;
        if (!element) {
            return;
        }
        const observer = new IntersectionObserver(
            (observed) => {
                const latest = observed[observed.length - 1];
                if (latest) {
                    setIsNearViewport(latest.isIntersecting);
                }
            },
            { rootMargin: '200px' }
        );
        observer.observe(element);
        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        const element = frameRef.current;
        if (!element) {
            return;
        }
        const observer = new ResizeObserver(() => {
            const scale = element.clientWidth / HTML_RENDER_WIDTH;
            setFrame({ scale, renderHeight: scale > 0 ? element.clientHeight / scale : 0 });
        });
        observer.observe(element);
        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div ref={frameRef} className="relative h-full w-full overflow-hidden bg-norm" aria-hidden="true">
            {isNearViewport && frame.scale > 0 && (
                <HtmlThumbnailFrame
                    type={type}
                    html={html}
                    title={title}
                    scale={frame.scale}
                    renderHeight={frame.renderHeight}
                />
            )}
        </div>
    );
};

interface DeckThumbnailProps {
    content: string;
}

/** A JSON deck's first slide, drawn by the app like the canvas preview: no iframe, nothing runs. */
const DeckThumbnail = ({ content }: DeckThumbnailProps) => {
    const frameRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    const firstSlide = useMemo(() => {
        const deck = readDeckContent(content)?.deck;
        return deck ? layoutDeck({ ...deck, slides: deck.slides.slice(0, 1) }).slides[0] : undefined;
    }, [content]);

    useEffect(() => {
        const element = frameRef.current;
        if (!element) {
            return;
        }
        const observer = new ResizeObserver(() => {
            setWidth(element.clientWidth);
        });
        observer.observe(element);
        return () => {
            observer.disconnect();
        };
    }, []);

    if (!firstSlide) {
        return <TypeIconThumbnail type="presentation" />;
    }
    return (
        <div ref={frameRef} className="h-full w-full overflow-hidden bg-weak" aria-hidden="true">
            {width > 0 && <DeckSlide slide={firstSlide} width={width} />}
        </div>
    );
};

interface Props {
    type?: ArtifactType;
    title: string;
    subtitle?: string;
    /** The decrypted source, once loaded. */
    content?: string;
    /** Prism language id for code, from the saved file's extension. */
    language?: string;
}

export const LibraryCreationThumbnail = ({ type, title, subtitle, content, language }: Props) => {
    if (!type || content === undefined) {
        return <div className="h-full bg-weak rectangle-skeleton keep-motion" aria-hidden="true" />;
    }
    if (type === 'document') {
        return <DocumentThumbnail title={title} subtitle={subtitle} />;
    }
    if (type === 'code') {
        return <CodeThumbnail content={content} language={language} />;
    }
    if (type === 'presentation' && looksLikeDeckJson(content)) {
        return <DeckThumbnail content={content} />;
    }
    // Local dev serves the shell from Lumo's own origin, where running the page would be unsafe.
    if (!isArtifactShellCrossOrigin()) {
        return <TypeIconThumbnail type={type} />;
    }
    return <HtmlThumbnail type={type} html={content} title={title} />;
};
