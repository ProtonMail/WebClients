import type { ArtifactType } from './parseArtifacts';

const SYNC_SUPPORTED_TYPES: ArtifactType[] = ['document', 'code', 'webpage', 'presentation'];

/** Side-panel artifact types that sync as GeneratedDoc space assets (AssetType=3). */
export function artifactTypeSupportsAssetSync(type: ArtifactType): boolean {
    return SYNC_SUPPORTED_TYPES.includes(type);
}
