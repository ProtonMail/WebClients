import { useGhostChat } from '../providers/GhostChatProvider';
import { useLumoDispatch } from '../redux/hooks';
import { createDate } from '../redux/slices/core/messages';
import type { ConversationId, SpaceId } from '../types';
import { initializeNewSpaceAndConversation } from '../components/Conversation/helper';

interface UseConversationStateProps {
    conversationId?: ConversationId;
    spaceId?: SpaceId;
}

export const useConversationState = (props: UseConversationStateProps) => {
    const dispatch = useLumoDispatch();
    const { isGhostChatMode } = useGhostChat();

    const ensureConversationAndSpace = (): Required<UseConversationStateProps> => {
        if (props.spaceId && props.conversationId) {
            return { conversationId: props.conversationId, spaceId: props.spaceId };
        }

        const now = createDate();
        const { conversationId, spaceId } = dispatch(initializeNewSpaceAndConversation(now, isGhostChatMode));

        return {
            conversationId,
            spaceId,
        };
    };

    return {
        ensureConversationAndSpace,
    };
};
