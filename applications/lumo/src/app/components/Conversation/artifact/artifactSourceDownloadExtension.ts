import { getFileExtension } from './parseArtifacts';
import type { ParsedArtifact } from './parseArtifacts';

/** File extension for panel "Download source" and GeneratedDoc asset sync (matches artifactTypeConfig). */
export function getArtifactSourceDownloadExtension(artifact: ParsedArtifact): string {
    switch (artifact.type) {
        case 'document':
            return 'md';
        case 'code':
            return getFileExtension(artifact.language ?? 'txt');
        case 'webpage':
        case 'presentation':
            return 'html';
        default:
            return 'txt';
    }
}
