import type { ArtifactType } from './parseArtifacts';

/** MVP: only document artifacts sync as GeneratedDoc assets (markdown source). */
export function artifactTypeSupportsAssetSync(type: ArtifactType): boolean {
    return type === 'document';
}
