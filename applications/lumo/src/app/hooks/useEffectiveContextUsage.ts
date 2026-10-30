import { useMemo } from 'react';

import { useFlag } from '@proton/unleash/useFlag';

import type { ContextFilter } from '../llm/contextFilter';
import { type EffectiveContextUsage, estimateEffectiveContextUsage } from '../llm/effectiveContextUsage';
import type { RequestBudget } from '../llm/requestBudget';
import { useRequestBudget } from './useContextLimits';
import { useLumoMemoSelector, useLumoSelector } from '../redux/hooks';
import { selectAttachments, selectContextFilters, selectMessagesByConversationId } from '../redux/selectors';
import type { Attachment, Message } from '../types';

function useConversationMessageMap(messageChain: Message[]) {
    const conversationId = messageChain[0]?.conversationId;
    return useLumoMemoSelector(selectMessagesByConversationId, [conversationId]);
}

/**
 * Express the local estimate in real tokens using the conversation's calibration, so the
 * indicator reads against the real window like the send path does.
 */
function toCalibratedUsage(usage: EffectiveContextUsage, budget: RequestBudget): EffectiveContextUsage {
    const scale = (tokens: number) => Math.round(tokens * budget.calibration);
    return {
        ...usage,
        conversationTokens: scale(usage.conversationTokens),
        toolCallTokens: scale(usage.toolCallTokens),
        fileTokens: scale(usage.fileTokens),
        usedTokens: scale(usage.usedTokens),
    };
}

export function useEffectiveContextUsage(messageChain: Message[], currentAttachments: Attachment[] = []) {
    const contextFilters = useLumoSelector(selectContextFilters);
    return useEffectiveContextUsageWithFilters(messageChain, contextFilters, currentAttachments);
}

export function useEffectiveContextUsageWithFilters(
    messageChain: Message[],
    contextFilters: ContextFilter[],
    currentAttachments: Attachment[] = []
) {
    const allAttachments = useLumoSelector(selectAttachments);
    const messageMap = useConversationMessageMap(messageChain);
    const budget = useRequestBudget(messageChain[0]?.conversationId);
    const fileCards = useFlag('LumoRetrievalTools');

    return useMemo(
        () =>
            toCalibratedUsage(
                estimateEffectiveContextUsage({
                    messageChain,
                    contextFilters,
                    currentAttachments,
                    allAttachments,
                    messageMap,
                    budget,
                    fileCards,
                }),
                budget
            ),
        [messageChain, contextFilters, currentAttachments, allAttachments, messageMap, budget, fileCards]
    );
}
