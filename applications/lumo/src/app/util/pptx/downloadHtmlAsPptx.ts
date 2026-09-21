import { downloadBytes } from '../pdf/downloadBlob';
import { type HtmlSlidesToPptxOptions, htmlSlidesToPptxBytes } from './htmlSlidesToPptxBytes';

/** Ensure a download file name ends with `.pptx`. */
export function ensurePptxFileName(fileName: string): string {
    return fileName.endsWith('.pptx') ? fileName : `${fileName}.pptx`;
}

/** Build PPTX bytes from one HTML document per slide and trigger a browser download. */
export async function downloadHtmlSlidesAsPptx(
    slideDocuments: string[],
    fileName: string,
    options?: HtmlSlidesToPptxOptions
): Promise<void> {
    const bytes = await htmlSlidesToPptxBytes(slideDocuments, options);
    downloadBytes(
        bytes,
        ensurePptxFileName(fileName),
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    );
}
