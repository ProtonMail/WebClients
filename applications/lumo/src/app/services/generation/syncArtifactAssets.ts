import { artifactTypeSupportsAssetSync } from '../../components/Conversation/artifact/artifactAssetSyncSupport';
import type { ArtifactRegistry } from '../../components/Conversation/artifact/artifactRegistry';
import { syncArtifactAssetRequest } from '../../redux/slices/artifactAssetSync';
import type { LumoDispatch } from '../../redux/store';

/** Queues completed artifact versions for the existing encrypted asset synchronization worker. */
export function syncArtifactAssets(dispatch: LumoDispatch, conversationId: string, registry: ArtifactRegistry): void {
    for (const [artifactId, entry] of Object.entries(registry)) {
        const latest = entry.versions.at(-1);
        if (!latest || latest.provisional || !artifactTypeSupportsAssetSync(entry.type)) continue;
        dispatch(
            syncArtifactAssetRequest({
                conversationId,
                artifactId,
                messageId: latest.messageId,
                title: entry.title,
                type: entry.type,
                content: latest.content,
                language: latest.language ?? entry.language,
            })
        );
    }
}
