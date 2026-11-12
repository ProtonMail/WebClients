import { useSyncExternalStore } from 'react';

import { generationRegistry } from '../services/generation/generationRegistry';
import type { ConversationId } from '../types';

export const useGenerationInProgress = (conversationId: ConversationId | undefined) => {
    const getSnapshot = () => {
        return conversationId !== undefined && generationRegistry.isInProgress(conversationId);
    };
    return useSyncExternalStore(generationRegistry.subscribe, getSnapshot, getSnapshot);
};
