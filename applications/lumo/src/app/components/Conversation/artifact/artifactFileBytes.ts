import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { DOCX_MIME_TYPE, markdownToDocxBlob } from '../../../util/docx/markdownToDocx';
import { yieldToMainThread } from '../../../util/export/exportUiHelpers';
import { ensurePdfFileName } from '../../../util/pdf/downloadHtmlAsPdf';
import { htmlDocumentToPdfBytes, htmlSlideDocumentsToPdfBytes } from '../../../util/pdf/htmlDocumentToPdfBytes';
import { ensurePptxFileName } from '../../../util/pptx/downloadHtmlAsPptx';
import { htmlSlidesToPptxBytes } from '../../../util/pptx/htmlSlidesToPptxBytes';
import { prepareDocxCharts } from './artifactDocxCharts';
import {
    PRESENTATION_PDF_EXPORT_OPTIONS,
    PRESENTATION_PPTX_EXPORT_OPTIONS,
    buildArtifactFileName,
    buildArtifactHtmlDocument,
    buildPresentationSlideExportDocuments,
    getArtifactPdfExportOptions,
} from './artifactHtmlDocument';
import { markdownToPlainText } from './artifactMarkdownPlainText';
import type { ArtifactSaveFormat } from './artifactSaveFormats';
import { isArtifactSaveFormatSupported } from './artifactSaveFormats';
import { normalizeDocumentCardFences } from './artifactVizCards';
import type { ParsedArtifact } from './parseArtifacts';

export type ArtifactFileBytesProgressCallback = (current: number, total: number) => void;

export interface ArtifactPreparedFile {
    data: BlobPart;
    fileName: string;
    mimeType: string;
}

const SAVE_FORMAT_MIME_TYPES: Record<ArtifactSaveFormat, string> = {
    docx: DOCX_MIME_TYPE,
    md: 'text/markdown',
    txt: 'text/plain',
    pdf: 'application/pdf',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

async function buildDocumentDocxBlob(artifact: ParsedArtifact): Promise<Blob> {
    const { markdown, localImages } = await prepareDocxCharts(normalizeDocumentCardFences(artifact.content));
    return markdownToDocxBlob(markdown, { title: artifact.title, creator: LUMO_SHORT_APP_NAME, localImages });
}

export async function buildArtifactFileForSave(
    artifact: ParsedArtifact,
    format: ArtifactSaveFormat,
    options: { onProgress?: ArtifactFileBytesProgressCallback } = {}
): Promise<ArtifactPreparedFile> {
    if (!artifact.content.trim()) {
        throw new Error('Artifact has no content to save.');
    }

    if (!isArtifactSaveFormatSupported(artifact.type, format)) {
        throw new Error(`Format "${format}" is not supported for ${artifact.type} artifacts.`);
    }

    const mimeType = SAVE_FORMAT_MIME_TYPES[format];
    const { onProgress } = options;

    if (format === 'md') {
        return {
            data: artifact.content,
            fileName: buildArtifactFileName(artifact, format),
            mimeType,
        };
    }

    if (format === 'txt') {
        const plainText = artifact.type === 'document' ? markdownToPlainText(artifact.content) : artifact.content;

        return {
            data: plainText,
            fileName: buildArtifactFileName(artifact, format),
            mimeType,
        };
    }

    if (format === 'docx') {
        return {
            // Word gets charts as images and leaked chat cards as table / quote (D12).
            data: await buildDocumentDocxBlob(artifact),
            fileName: buildArtifactFileName(artifact, format),
            mimeType,
        };
    }

    if (format === 'pdf') {
        return buildArtifactPdfFile(artifact, onProgress);
    }

    return buildArtifactPptxFile(artifact, onProgress);
}

async function buildArtifactPdfFile(
    artifact: ParsedArtifact,
    onProgress?: ArtifactFileBytesProgressCallback
): Promise<ArtifactPreparedFile> {
    if (artifact.type === 'presentation') {
        onProgress?.(0, 1);
        await yieldToMainThread();

        const slideDocuments = await buildPresentationSlideExportDocuments(artifact, {
            onPrepareProgress: onProgress,
        });

        if (slideDocuments.length === 0) {
            throw new Error('Presentation has no slides to export.');
        }

        await yieldToMainThread();

        const bytes = await htmlSlideDocumentsToPdfBytes(slideDocuments, {
            ...PRESENTATION_PDF_EXPORT_OPTIONS,
            onProgress,
        });

        return {
            data: bytes,
            fileName: ensurePdfFileName(buildArtifactFileName(artifact, 'pdf')),
            mimeType: SAVE_FORMAT_MIME_TYPES.pdf,
        };
    }

    if (artifact.type !== 'document') {
        throw new Error('PDF export is only supported for documents and presentations.');
    }

    const html = await buildArtifactHtmlDocument(artifact);
    if (!html) {
        throw new Error('Could not build HTML for PDF export.');
    }

    const bytes = await htmlDocumentToPdfBytes(html, {
        ...getArtifactPdfExportOptions(artifact.type),
        onProgress,
    });

    return {
        data: bytes,
        fileName: ensurePdfFileName(buildArtifactFileName(artifact, 'pdf')),
        mimeType: SAVE_FORMAT_MIME_TYPES.pdf,
    };
}

async function buildArtifactPptxFile(
    artifact: ParsedArtifact,
    onProgress?: ArtifactFileBytesProgressCallback
): Promise<ArtifactPreparedFile> {
    if (artifact.type !== 'presentation') {
        throw new Error('PPTX export is only supported for presentations.');
    }

    onProgress?.(0, 1);
    await yieldToMainThread();

    const slideDocuments = await buildPresentationSlideExportDocuments(artifact, {
        onPrepareProgress: onProgress,
    });

    if (slideDocuments.length === 0) {
        throw new Error('Presentation has no slides to export.');
    }

    await yieldToMainThread();

    const bytes = await htmlSlidesToPptxBytes(slideDocuments, {
        ...PRESENTATION_PPTX_EXPORT_OPTIONS,
        onProgress,
    });

    return {
        data: bytes,
        fileName: ensurePptxFileName(buildArtifactFileName(artifact, 'pptx')),
        mimeType: SAVE_FORMAT_MIME_TYPES.pptx,
    };
}
