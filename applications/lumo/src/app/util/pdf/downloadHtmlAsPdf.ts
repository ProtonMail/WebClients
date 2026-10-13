import { triggerFileDownload } from '../triggerFileDownload';
import {
    type HtmlDocumentToPdfOptions,
    htmlDocumentToPdfBytes,
    htmlSlideDocumentsToPdfBytes,
} from './htmlDocumentToPdfBytes';

/** Ensure a download file name ends with `.pdf`. */
export function ensurePdfFileName(fileName: string): string {
    return fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
}

/** Build PDF bytes from HTML and trigger a browser download. */
export async function downloadHtmlAsPdf(
    html: string,
    fileName: string,
    options?: HtmlDocumentToPdfOptions
): Promise<void> {
    const bytes = await htmlDocumentToPdfBytes(html, options);
    await triggerFileDownload(new Blob([bytes], { type: 'application/pdf' }), ensurePdfFileName(fileName));
}

/** Build PDF bytes from one HTML document per slide and trigger a browser download. */
export async function downloadHtmlSlidesAsPdf(
    slideDocuments: string[],
    fileName: string,
    options?: Omit<HtmlDocumentToPdfOptions, 'pageSelector'>
): Promise<void> {
    const bytes = await htmlSlideDocumentsToPdfBytes(slideDocuments, options);
    await triggerFileDownload(new Blob([bytes], { type: 'application/pdf' }), ensurePdfFileName(fileName));
}
