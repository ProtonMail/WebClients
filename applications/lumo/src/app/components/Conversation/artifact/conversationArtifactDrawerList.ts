import type { ArtifactRegistry } from './artifactRegistry';
import { artifactTypeSupportsAssetSync } from './buildArtifactAssetFile';
import type { ArtifactType } from './parseArtifacts';

export interface ConversationArtifactDrawerEntry {
    id: string;
    title: string;
    type: ArtifactType;
    language?: string;
    latestVersionIndex: number;
    content: string;
}

/** One row per artifact slug — latest non-provisional version only (matches Creations / asset sync). */
export const getConversationArtifactsForDrawer = (registry: ArtifactRegistry): ConversationArtifactDrawerEntry[] => {
    const entries: ConversationArtifactDrawerEntry[] = [];

    for (const [id, entry] of Object.entries(registry)) {
        if (!artifactTypeSupportsAssetSync(entry.type)) {
            continue;
        }

        const latestVersionIndex = entry.versions.length - 1;
        const latestVersion = entry.versions[latestVersionIndex];
        if (!latestVersion || latestVersion.provisional || !latestVersion.content.trim()) {
            continue;
        }

        entries.push({
            id,
            title: entry.title,
            type: entry.type,
            language: latestVersion.language ?? entry.language,
            latestVersionIndex,
            content: latestVersion.content,
        });
    }

    return entries.sort((a, b) => {
        return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
    });
};
