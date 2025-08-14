import { useGhostChat } from '../providers/GhostChatProvider';
import { useLumoDispatch } from '../redux/hooks';
import { createDatePair } from '../redux/slices/core/messages';
import type { ConversationId, SpaceId } from '../types';
import { initializeNewSpaceAndConversation } from '../ui/interactiveConversation/helper';

interface UseConversationStateProps {
    conversationId?: ConversationId;
    spaceId?: SpaceId;
}

export const useConversationState = ({ conversationId, spaceId }: UseConversationStateProps) => {
    const dispatch = useLumoDispatch();
    const { isGhostChatMode } = useGhostChat();
    // const generatedConversationIdRef = useRef<ConversationId | null>(null);

    const ensureConversationAndSpace = (
        inputConversationId?: ConversationId,
        inputSpaceId?: SpaceId
    ): { conversationId: ConversationId; spaceId: SpaceId; datePair?: [string, string] } => {
        if (inputSpaceId && inputConversationId) {
            return { conversationId: inputConversationId, spaceId: inputSpaceId };
        }

        const datePair = createDatePair();
        const { conversationId: newConversationId, spaceId: newSpaceId } = initializeNewSpaceAndConversation(
            dispatch,
            datePair[0],
            isGhostChatMode
        );

        // generatedConversationIdRef.current = newConversationId;

        return {
            conversationId: newConversationId,
            spaceId: newSpaceId,
            datePair,
        };
    };

    return {
        ensureConversationAndSpace,
        // generatedConversationIdRef,
    };
};
