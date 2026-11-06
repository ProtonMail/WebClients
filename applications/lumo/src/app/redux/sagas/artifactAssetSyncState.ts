import type { ConversationId } from '../../types';

// Which creations have an upload running or waiting. Kept apart from the sync saga so that other sagas can ask
// without importing the code that builds files.
export const syncingArtifactKeys = new Set<string>();
export const pendingArtifactSyncKeys = new Set<string>();

export const getArtifactSyncKey = ({ conversationId, artifactId }: { conversationId: string; artifactId: string }) =>
    `${conversationId}:${artifactId}`;

/** An artifact upload for the conversation is running or queued, so its `artifactAssets` pointers are about to change. */
export const hasPendingArtifactSync = (conversationId: ConversationId): boolean => {
    const prefix = `${conversationId}:`;
    return [...syncingArtifactKeys, ...pendingArtifactSyncKeys].some((key) => key.startsWith(prefix));
};
