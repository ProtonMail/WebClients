import { yieldToMainThread } from '../../../util/export/exportUiHelpers';
import { downloadHtmlAsPdf, downloadHtmlSlidesAsPdf } from '../../../util/pdf/downloadHtmlAsPdf';
import type { PdfExportProgressCallback } from '../../../util/pdf/htmlDocumentToPdfBytes';
import { printHtmlDocument } from '../../../util/pdf/printHtmlDocument';
import {
    PRESENTATION_PDF_EXPORT_OPTIONS,
    artifactSupportsPdfExport,
    buildArtifactFileName,
    buildArtifactHtmlDocument,
    buildPresentationSlideExportDocuments,
    getArtifactPdfExportOptions,
} from './artifactHtmlDocument';
import type { ParsedArtifact } from './parseArtifacts';

export type ArtifactPdfDownloadResult = 'success' | 'print_fallback' | 'unavailable' | 'failed';

export interface DownloadArtifactPdfOptions {
    onProgress?: PdfExportProgressCallback;
}

export { artifactSupportsPdfExport, buildArtifactFileName } from './artifactHtmlDocument';

/** Download an artifact as PDF, falling back to the browser print dialog when capture fails. */
export async function downloadArtifactPdf(
    artifact: ParsedArtifact,
    options: DownloadArtifactPdfOptions = {}
): Promise<ArtifactPdfDownloadResult> {
    if (!artifactSupportsPdfExport(artifact.type)) {
        return 'unavailable';
    }

    const fileName = buildArtifactFileName(artifact, 'pdf');
    const { onProgress } = options;

    if (artifact.type === 'presentation') {
        onProgress?.(0, 1);
        await yieldToMainThread();

        const slideDocuments = await buildPresentationSlideExportDocuments(artifact, {
            onPrepareProgress: onProgress,
        });
        if (slideDocuments.length === 0) {
            return 'unavailable';
        }

        await yieldToMainThread();

        try {
            await downloadHtmlSlidesAsPdf(slideDocuments, fileName, {
                ...PRESENTATION_PDF_EXPORT_OPTIONS,
                onProgress,
            });
            return 'success';
        } catch {
            const stackedHtml = await buildArtifactHtmlDocument(artifact);
            if (stackedHtml && printHtmlDocument(stackedHtml)) {
                return 'print_fallback';
            }

            return 'failed';
        }
    }

    const html = await buildArtifactHtmlDocument(artifact);
    if (!html) {
        return 'unavailable';
    }

    const pdfOptions = getArtifactPdfExportOptions(artifact.type);

    try {
        await downloadHtmlAsPdf(html, fileName, {
            ...pdfOptions,
            onProgress,
        });
        return 'success';
    } catch {
        const printed = printHtmlDocument(html);
        return printed ? 'print_fallback' : 'failed';
    }
}
