import { useMemo } from 'react';

import type { ContextFilter } from '../llm/contextFilter';
import { estimateEffectiveContextUsage } from '../llm/effectiveContextUsage';
import { useLumoMemoSelector, useLumoSelector } from '../redux/hooks';
import { selectAttachments, selectContextFilters, selectMessagesByConversationId } from '../redux/selectors';
import type { Attachment, Message } from '../types';

function useConversationMessageMap(messageChain: Message[]) {
    const conversationId = messageChain[0]?.conversationId;
    return useLumoMemoSelector(selectMessagesByConversationId, [conversationId]);
}

export function useEffectiveContextUsage(messageChain: Message[], currentAttachments: Attachment[] = []) {
    const allAttachments = useLumoSelector(selectAttachments);
    const contextFilters = useLumoSelector(selectContextFilters);
    const messageMap = useConversationMessageMap(messageChain);

    return useMemo(
        () =>
            estimateEffectiveContextUsage({
                messageChain,
                contextFilters,
                currentAttachments,
                allAttachments,
                messageMap,
            }),
        [messageChain, contextFilters, currentAttachments, allAttachments, messageMap]
    );
}

export function useEffectiveContextUsageWithFilters(
    messageChain: Message[],
    contextFilters: ContextFilter[],
    currentAttachments: Attachment[] = []
) {
    const allAttachments = useLumoSelector(selectAttachments);
    const messageMap = useConversationMessageMap(messageChain);

    return useMemo(
        () =>
            estimateEffectiveContextUsage({
                messageChain,
                contextFilters,
                currentAttachments,
                allAttachments,
                messageMap,
            }),
        [messageChain, contextFilters, currentAttachments, allAttachments, messageMap]
    );
}
