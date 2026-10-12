import { yieldToMainThread } from '../../../util/export/exportUiHelpers';
import { downloadHtmlAsPdf, downloadHtmlSlidesAsPdf } from '../../../util/pdf/downloadHtmlAsPdf';
import type { PdfExportProgressCallback } from '../../../util/pdf/htmlDocumentToPdfBytes';
import { printHtmlDocument } from '../../../util/pdf/printHtmlDocument';
import {
    DOCUMENT_PDF_EXPORT_OPTIONS,
    PRESENTATION_PDF_EXPORT_OPTIONS,
    artifactSupportsPdfExport,
    buildArtifactFileName,
    buildArtifactHtmlDocument,
    buildPresentationSlideExportDocuments,
} from './artifactHtmlDocument';
import type { ArtifactType, ParsedArtifact } from './parseArtifacts';

/**
 * - `success`: a PDF file was generated and downloaded.
 * - `print_dialog`: the browser print dialog opened so the user can "Save as PDF" (documents).
 * - `print_fallback`: generating the file failed, so the print dialog was opened instead (presentations).
 * - `image_fallback`: the print dialog couldn't be opened, so an image-page PDF was downloaded instead (documents).
 */
export type ArtifactPdfExportResult =
    'success' | 'print_dialog' | 'print_fallback' | 'image_fallback' | 'unavailable' | 'failed';

/**
 * How the Download menu's PDF item works for each artifact type (see D7 in artifact-view-decisions.md):
 * - `print`: documents open the browser print dialog. "Save as PDF" gives real selectable text,
 *   clickable links, content-aware page breaks and a small file, none of which the in-app image
 *   capture can match.
 * - `download`: presentations download one 16:9 image page per slide in one click; a slide is a
 *   fixed-size picture anyway, so capture loses little.
 */
export type ArtifactPdfExportMode = 'print' | 'download';

export interface ExportArtifactPdfOptions {
    onProgress?: PdfExportProgressCallback;
}

export { artifactSupportsPdfExport, buildArtifactFileName } from './artifactHtmlDocument';

export function getArtifactPdfExportMode(type: ArtifactType): ArtifactPdfExportMode | undefined {
    if (type === 'document') {
        return 'print';
    }

    if (type === 'presentation') {
        return 'download';
    }

    return undefined;
}

async function exportDocumentPdf(
    artifact: ParsedArtifact,
    onProgress?: PdfExportProgressCallback
): Promise<ArtifactPdfExportResult> {
    const html = await buildArtifactHtmlDocument(artifact);
    if (!html) {
        return 'unavailable';
    }

    if (await printHtmlDocument(html, { title: artifact.title })) {
        return 'print_dialog';
    }

    // Rare (the frame couldn't be created or print() threw): still give the user a file.
    try {
        await downloadHtmlAsPdf(html, buildArtifactFileName(artifact, 'pdf'), {
            ...DOCUMENT_PDF_EXPORT_OPTIONS,
            onProgress,
        });
        return 'image_fallback';
    } catch {
        return 'failed';
    }
}

async function exportPresentationPdf(
    artifact: ParsedArtifact,
    onProgress?: PdfExportProgressCallback
): Promise<ArtifactPdfExportResult> {
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
        await downloadHtmlSlidesAsPdf(slideDocuments, buildArtifactFileName(artifact, 'pdf'), {
            ...PRESENTATION_PDF_EXPORT_OPTIONS,
            onProgress,
        });
        return 'success';
    } catch {
        const stackedHtml = await buildArtifactHtmlDocument(artifact);
        if (stackedHtml && (await printHtmlDocument(stackedHtml, { title: artifact.title }))) {
            return 'print_fallback';
        }

        return 'failed';
    }
}

/** Export an artifact as PDF from the Download menu, using its type's `ArtifactPdfExportMode`. */
export async function exportArtifactPdf(
    artifact: ParsedArtifact,
    options: ExportArtifactPdfOptions = {}
): Promise<ArtifactPdfExportResult> {
    if (!artifactSupportsPdfExport(artifact.type)) {
        return 'unavailable';
    }

    if (getArtifactPdfExportMode(artifact.type) === 'print') {
        return exportDocumentPdf(artifact, options.onProgress);
    }

    return exportPresentationPdf(artifact, options.onProgress);
}
