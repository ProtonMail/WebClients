import { useCallback } from 'react';

import { useLumoDispatch, useLumoSelector } from '../redux/hooks';
import { clearPendingAgent, setPendingAgent } from '../redux/slices/composerActions';
import { pushConversationRequest, setConversationAgent } from '../redux/slices/core/conversations';
import { useCustomAgents } from './useCustomAgents';

/**
 * Reads and mutates the custom agent active for a conversation.
 *
 * - For an existing conversation the agent id is stored on the conversation.
 * - For a brand-new conversation (no id yet) the selection lives in `pendingAgentId`
 *   and is stamped onto the conversation when the first message is sent.
 */
export function useConversationAgent(conversationId?: string) {
    const dispatch = useLumoDispatch();
    const { getAgent } = useCustomAgents();

    const conversationAgentId = useLumoSelector((state) =>
        conversationId ? state.conversations[conversationId]?.agentId : undefined
    );
    const pendingAgentId = useLumoSelector((state) => state.composerActions.pendingAgentId);

    const activeAgentId = conversationId ? conversationAgentId : (pendingAgentId ?? undefined);
    const activeAgent = getAgent(activeAgentId);

    const activateAgent = useCallback(
        (agentId: string) => {
            if (conversationId) {
                dispatch(setConversationAgent({ id: conversationId, agentId }));
                dispatch(pushConversationRequest({ id: conversationId }));
            } else {
                dispatch(setPendingAgent(agentId));
            }
        },
        [conversationId, dispatch]
    );

    const clearAgent = useCallback(() => {
        if (conversationId) {
            dispatch(setConversationAgent({ id: conversationId, agentId: undefined }));
            dispatch(pushConversationRequest({ id: conversationId }));
        } else {
            dispatch(clearPendingAgent());
        }
    }, [conversationId, dispatch]);

    return { activeAgent, activeAgentId, activateAgent, clearAgent };
}
