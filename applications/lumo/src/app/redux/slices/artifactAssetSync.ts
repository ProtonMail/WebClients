import { createAction } from '@reduxjs/toolkit';

import type { ArtifactType } from '../../components/Conversation/artifact/parseArtifacts';
import type { ConversationId, MessageId } from '../../types';

export type SyncArtifactAssetRequest = {
    conversationId: ConversationId;
    artifactId: string;
    messageId: MessageId;
    title: string;
    type: ArtifactType;
    content: string;
    language?: string;
};

export const syncArtifactAssetRequest = createAction<SyncArtifactAssetRequest>('lumo/artifactAsset/syncRequest');
