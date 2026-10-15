import { isDeckArtifact } from '../../../util/slides/deckContent';
import { getFileExtension } from './parseArtifacts';
import type { ParsedArtifact } from './parseArtifacts';

/** File extension for panel "Download source" and GeneratedDoc asset sync (matches artifactTypeConfig). */
export function getArtifactSourceDownloadExtension(artifact: ParsedArtifact): string {
    // A JSON deck's source is the deck itself (D18); HTML decks keep their standalone .html.
    if (isDeckArtifact(artifact)) {
        return 'json';
    }
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
