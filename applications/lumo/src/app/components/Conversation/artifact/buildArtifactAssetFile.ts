import type { ParsedArtifact } from './parseArtifacts';

export { artifactTypeSupportsAssetSync } from './artifactAssetSyncSupport';

function buildMarkdownAssetFileName(title: string): string {
    const stem =
        title
            .normalize('NFC')
            .replace(/\s+/g, ' ')
            .replace(/[\u0000-\u001f\u007f]+/g, '')
            .replace(/\s*[\\/:*?"<>|][\\/:*?"<>|\s]*/g, ' - ')
            .replace(/\s+/g, ' ')
            .slice(0, 120)
            .replace(/^(?:\s-\s|[\s.])+|(?:\s-\s|[\s.])+$/g, '') || 'artifact';
    return `${stem}.md`;
}

/** Builds markdown bytes for GeneratedDoc upload (same string as create_artifact `content`). */
export async function buildArtifactAssetFile(artifact: ParsedArtifact) {
    const content = artifact.content;
    if (!content.trim()) {
        throw new Error('Artifact has no content to save.');
    }
    return {
        data: content,
        fileName: buildMarkdownAssetFileName(artifact.title),
        mimeType: 'text/markdown',
    };
}

export function preparedFileToBytes(data: BlobPart): Uint8Array<ArrayBuffer> {
    if (typeof data === 'string') {
        return new TextEncoder().encode(data) as Uint8Array<ArrayBuffer>;
    }
    if (data instanceof ArrayBuffer) {
        return new Uint8Array(data) as Uint8Array<ArrayBuffer>;
    }
    if (ArrayBuffer.isView(data)) {
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength) as Uint8Array<ArrayBuffer>;
    }
    throw new Error('Unsupported artifact asset payload type');
}
