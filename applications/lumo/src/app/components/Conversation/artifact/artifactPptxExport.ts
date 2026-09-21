import { yieldToMainThread } from '../../../util/export/exportUiHelpers';
import type { SlideCaptureProgressCallback } from '../../../util/export/htmlDocumentCapture';
import { downloadHtmlSlidesAsPptx } from '../../../util/pptx/downloadHtmlAsPptx';
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

export { artifactSupportsPptxExport, buildArtifactFileName } from './artifactHtmlDocument';

/** Download a presentation artifact as PPTX (one rasterized image slide per section). */
export async function downloadArtifactPptx(
    artifact: ParsedArtifact,
    options: DownloadArtifactPptxOptions = {}
): Promise<ArtifactPptxDownloadResult> {
    if (!artifactSupportsPptxExport(artifact.type)) {
        return 'unavailable';
    }

    const fileName = buildArtifactFileName(artifact, 'pptx');

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
