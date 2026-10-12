import { type HtmlSlideCaptureOptions, captureSlideDocumentsToImages } from '../export/htmlDocumentCapture';

export type HtmlSlidesToPptxOptions = HtmlSlideCaptureOptions;

type PptxGenInstance = {
    layout: string;
    addSlide: () => PptxSlide;
    write: (options: { outputType: 'arraybuffer' }) => Promise<ArrayBuffer | string | Blob>;
};

type PptxSlide = {
    addImage: (options: {
        data: string;
        x: number | string;
        y: number | string;
        w: number | string;
        h: number | string;
    }) => void;
};

type PptxGenConstructor = new () => PptxGenInstance;

/**
 * Render multiple standalone slide HTML documents to one PPTX file.
 * Each slide is captured as a full-bleed 16:9 PNG, so the 100% × 100% placement never distorts it.
 */
export async function htmlSlidesToPptxBytes(
    slideDocuments: string[],
    options: HtmlSlidesToPptxOptions = {}
): Promise<ArrayBuffer> {
    if (typeof document === 'undefined') {
        throw new Error('HTML slide PPTX export requires a browser environment.');
    }

    const slideImages = await captureSlideDocumentsToImages(slideDocuments, options);

    const pptxgenModule = await import('pptxgenjs');
    const PptxGenJS = pptxgenModule.default as unknown as PptxGenConstructor;
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    for (const slideImage of slideImages) {
        const slide = pptx.addSlide();
        slide.addImage({
            data: slideImage,
            x: 0,
            y: 0,
            w: '100%',
            h: '100%',
        });
    }

    const output = await pptx.write({ outputType: 'arraybuffer' });

    if (!(output instanceof ArrayBuffer)) {
        throw new Error('PPTX export did not produce an ArrayBuffer.');
    }

    return output;
}
