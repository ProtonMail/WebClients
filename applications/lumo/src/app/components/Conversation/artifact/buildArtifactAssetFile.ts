import { buildArtifactSourceDownloadFile } from './artifactSourceDownload';
import type { ParsedArtifact } from './parseArtifacts';

export { artifactTypeSupportsAssetSync } from './artifactAssetSyncSupport';

/** Builds source bytes for GeneratedDoc upload (AssetType=3), aligned with panel source download. */
export async function buildArtifactAssetFile(artifact: ParsedArtifact) {
    return buildArtifactSourceDownloadFile(artifact);
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
