import { isDeckArtifact } from '../../../util/slides/deckContent';
import { buildArtifactFileName } from './artifactHtmlDocument';
import { buildStandalonePresentationHtml } from './artifactPresentationStandalone';
import { getArtifactSourceDownloadExtension } from './artifactSourceDownloadExtension';
import type { ParsedArtifact } from './parseArtifacts';

const SOURCE_DOWNLOAD_MIME_TYPES: Record<string, string> = {
    md: 'text/markdown;charset=utf-8',
    html: 'text/html;charset=utf-8',
    json: 'application/json;charset=utf-8',
};

export const getArtifactSourceDownloadMimeType = (extension: string): string => {
    const normalized = extension.replace(/^\./, '').toLowerCase();
    return SOURCE_DOWNLOAD_MIME_TYPES[normalized] ?? 'text/plain;charset=utf-8';
};

export type ArtifactSourceDownloadFile = {
    data: string;
    fileName: string;
    mimeType: string;
};

/**
 * Canonical "source" bytes for an artifact — same payload as panel "Download source"
 * and GeneratedDoc asset sync (AssetType=3).
 */
export async function buildArtifactSourceDownloadFile(artifact: ParsedArtifact): Promise<ArtifactSourceDownloadFile> {
    if (!artifact.content.trim()) {
        throw new Error('Artifact has no content to save.');
    }

    const extension = getArtifactSourceDownloadExtension(artifact);
    const fileName = buildArtifactFileName(artifact, extension);
    const mimeType = getArtifactSourceDownloadMimeType(extension);

    const data =
        artifact.type === 'presentation' && !isDeckArtifact(artifact)
            ? await buildStandalonePresentationHtml(artifact)
            : artifact.content;

    return {
        data,
        fileName,
        mimeType,
    };
}
