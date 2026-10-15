import { yieldToMainThread } from '../../../util/export/exportUiHelpers';
import type { SlideCaptureProgressCallback } from '../../../util/export/htmlDocumentCapture';
import { downloadBytes } from '../../../util/pdf/downloadBlob';
import { downloadHtmlSlidesAsPptx, ensurePptxFileName } from '../../../util/pptx/downloadHtmlAsPptx';
import { isDeckArtifact } from '../../../util/slides/deckContent';
import { buildDeckPptxBytes } from './artifactDeckPptx';
import {
    PRESENTATION_PPTX_EXPORT_OPTIONS,
    artifactSupportsPptxExport,
    buildArtifactFileName,
    buildPresentationSlideExportDocuments,
} from './artifactHtmlDocument';
import type { ParsedArtifact } from './parseArtifacts';

export type ArtifactPptxDownloadResult = 'success' | 'unavailable' | 'failed';

export interface DownloadArtifactPptxOptions {
    onProgress?: SlideCaptureProgressCallback;
}

export { artifactSupportsPptxExport } from './artifactHtmlDocument';

/** Download a presentation as PPTX: native for JSON decks, one rasterized image per slide for HTML decks. */
export async function downloadArtifactPptx(
    artifact: ParsedArtifact,
    options: DownloadArtifactPptxOptions = {}
): Promise<ArtifactPptxDownloadResult> {
    if (!artifactSupportsPptxExport(artifact.type)) {
        return 'unavailable';
    }

    const fileName = buildArtifactFileName(artifact, 'pptx');

    if (isDeckArtifact(artifact)) {
        try {
            downloadBytes(
                await buildDeckPptxBytes(artifact),
                ensurePptxFileName(fileName),
                'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            );
            return 'success';
        } catch {
            return 'failed';
        }
    }

    options.onProgress?.(0, 1);
    await yieldToMainThread();

    const slideDocuments = await buildPresentationSlideExportDocuments(artifact, {
        onPrepareProgress: options.onProgress,
    });

    if (slideDocuments.length === 0) {
        return 'unavailable';
    }

    await yieldToMainThread();

    try {
        await downloadHtmlSlidesAsPptx(slideDocuments, fileName, {
            ...PRESENTATION_PPTX_EXPORT_OPTIONS,
            onProgress: options.onProgress,
        });
        return 'success';
    } catch {
        return 'failed';
    }
}
