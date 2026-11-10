import { useSyncExternalStore } from 'react';

import { generationRegistry } from '../services/generation/generationRegistry';
import type { ConversationId } from '../types';

/** Whether a reply is being generated for this conversation, including when it is not the open one. */
export function useIsConversationGenerating(conversationId: ConversationId | undefined): boolean {
    const read = () => !!conversationId && generationRegistry.isInProgress(conversationId);
    return useSyncExternalStore(generationRegistry.subscribe, read, () => false);
}
