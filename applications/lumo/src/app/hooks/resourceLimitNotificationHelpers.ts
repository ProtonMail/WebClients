import type { ResourceLimitError } from '../redux/slices/meta/errors';
import type { ConversationId, SpaceId } from '../types';

export const shouldShowResourceLimitError = (
    error: ResourceLimitError,
    activeConversationId: ConversationId | undefined,
    activeSpaceId: SpaceId | undefined
): boolean => {
    if (error.resource === 'messages' || error.resource === 'conversations') {
        if (!error.conversationId) {
            return true;
        }

        return error.conversationId === activeConversationId;
    }

    if (error.resource === 'assets') {
        if (!error.spaceId) {
            return true;
        }

        return error.spaceId === activeSpaceId;
    }

    return true;
};
