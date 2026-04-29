import type { ResourceLimitError } from '../redux/slices/meta/errors';
import type { ConversationId } from '../types';

export const shouldShowResourceLimitError = (
    error: ResourceLimitError,
    activeConversationId: ConversationId | undefined
): boolean => {
    if (error.resource !== 'messages' || !error.conversationId) {
        return true;
    }

    return error.conversationId === activeConversationId;
};
