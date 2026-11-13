import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

import { yieldToMainThread } from '../../../util/export/exportUiHelpers';
import type { PdfExportProgressCallback } from '../../../util/pdf/htmlDocumentToPdfBytes';
import { readDeckContent } from '../../../util/slides/deckContent';
import { PAGE_HEIGHT_PT, PAGE_WIDTH_PT, canWriteDeckPdfAsText, deckToPdfBytes } from '../../../util/slides/deckToPdf';
import type { LaidOutDeck } from '../../../util/slides/layoutDeck';
import { layoutDeck } from '../../../util/slides/layoutDeck';
import { DeckSlide, SLIDE_HEIGHT_PX, SLIDE_WIDTH_PX } from './DeckSlide';
import type { ParsedArtifact } from './parseArtifacts';

/** 2 × 960 px wide: sharp at a normal screen zoom, unlike the soft 1× capture. */
const IMAGE_FALLBACK_SCALE = 2;

type Html2CanvasFn = (element: HTMLElement, options: Record<string, unknown>) => Promise<HTMLCanvasElement>;

/**
 * Image pages for decks whose text the built-in PDF fonts can't show (D26). Slides are captured from an
 * element in this document. The html2canvas 1.4.1 iframe scaling bug is patched separately (LUMO-988).
 * Each slide is rendered by React straight into that element, never through an
 * HTML string, so deck text stays text even though the element shares the app's origin.
 */
const captureDeckPdfImages = async (laidOut: LaidOutDeck, onProgress?: PdfExportProgressCallback) => {
    const [{ jsPDF }, html2canvasModule] = await Promise.all([import('jspdf'), import('html2canvas')]);
    const html2canvas = html2canvasModule.default as unknown as Html2CanvasFn;
    const doc = new jsPDF({ unit: 'pt', format: [PAGE_WIDTH_PT, PAGE_HEIGHT_PT], orientation: 'landscape' });
    doc.setProperties({ title: laidOut.title });

    // In the viewport behind the UI: far off-screen or hidden mounts make html2canvas draw nothing.
    const container = document.createElement('div');
    container.setAttribute('aria-hidden', 'true');
    Object.assign(container.style, {
        position: 'fixed',
        left: '0',
        top: '0',
        zIndex: '-1',
        width: `${SLIDE_WIDTH_PX}px`,
        height: `${SLIDE_HEIGHT_PX}px`,
        pointerEvents: 'none',
    });
    document.body.appendChild(container);
    const root = createRoot(container);

    try {
        for (let index = 0; index < laidOut.slides.length; index++) {
            onProgress?.(index + 1, laidOut.slides.length);
            await yieldToMainThread();
            // Synchronous, so the slide is in the DOM before html2canvas reads it.
            flushSync(() => {
                root.render(createElement(DeckSlide, { slide: laidOut.slides[index], width: SLIDE_WIDTH_PX }));
            });
            const target = container.firstElementChild as HTMLElement;
            // The preview's rounded corners and shadow would show as white corners on a page.
            target.removeAttribute('class');
            const canvas = await html2canvas(target, {
                scale: IMAGE_FALLBACK_SCALE,
                width: SLIDE_WIDTH_PX,
                height: SLIDE_HEIGHT_PX,
                backgroundColor: '#ffffff',
                logging: false,
                scrollX: 0,
                scrollY: 0,
            });
            if (index > 0) {
                doc.addPage([PAGE_WIDTH_PT, PAGE_HEIGHT_PT], 'landscape');
            }
            // Lossless Flate keeps text edges crisp; flat slide colours compress well.
            doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, PAGE_WIDTH_PT, PAGE_HEIGHT_PT, undefined, 'FAST');
            canvas.width = 0;
            canvas.height = 0;
        }
    } finally {
        root.unmount();
        container.remove();
    }
    return doc.output('arraybuffer');
};

/**
 * A JSON deck's PDF (D26): real text and vector charts from the layout. Text the built-in PDF fonts
 * can't show (outside Western European) falls back to one captured image per slide.
 */
export async function buildDeckPdfBytes(
    artifact: ParsedArtifact,
    onProgress?: PdfExportProgressCallback
): Promise<ArrayBuffer> {
    const deck = readDeckContent(artifact.content)?.deck;
    if (!deck) {
        throw new Error('Slide deck could not be read.');
    }
    const laidOut = layoutDeck(deck);
    if (laidOut.slides.length === 0) {
        throw new Error('Slide deck has no slides.');
    }
    if (canWriteDeckPdfAsText(laidOut)) {
        const bytes = await deckToPdfBytes(laidOut);
        onProgress?.(1, 1);
        return bytes;
    }
    return captureDeckPdfImages(laidOut, onProgress);
}
