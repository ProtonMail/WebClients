import type { ContextFilter } from './contextFilter';
import { collapseCompactedChain } from './compaction/collapse';
import { getSummarizedMessageIds } from './compaction';
import { fileCardPolicy } from '../features/client-tools/retrievalTool/instructions';
import { resolveRequestContextFiles } from './requestContextFiles';
import { countTokens } from './tokenizer';
import { type RequestBudget, getFileTokenBudget, getRequestBudget } from './requestBudget';
import { calculateAttachmentContextSize, calculateMessageTokenBreakdown } from './utils';
import type { Attachment, Message, MessageId } from '../types';

export type EffectiveContextUsageInput = {
    /** Active fork linear chain (from preferred siblings). */
    messageChain: Message[];
    contextFilters: ContextFilter[];
    currentAttachments?: Attachment[];
    allAttachments: Record<string, Attachment>;
    /** Conversation-scoped messages; enables shared-history compaction on edit forks. */
    messageMap?: Record<MessageId, Message>;
    /** Budget of the next request, used for file budgeting. */
    budget?: RequestBudget;
    /** The lookup tools are registered, so large files are sent as cards. */
    fileCards?: boolean;
};

export type EffectiveContextUsage = {
    /** Message text plus the latest compaction summary (post-compaction view). Excludes tool blocks. */
    conversationTokens: number;
    /** tool_call and tool_result blocks that would be sent on the next request. */
    toolCallTokens: number;
    /** Attachments that would be sent on the next request. */
    fileTokens: number;
    usedTokens: number;
    hasCompaction: boolean;
    activeFiles: Attachment[];
    /** Files held back because they no longer fit the request's file budget. */
    droppedForBudget: Attachment[];
    /** Attached files sent only as an excerpt because they exceed the file budget: id → excerpt tokens. */
    excerptedForBudget: Map<string, number>;
    /** Files sent as a card pointing at the lookup tools, and why. */
    cardedFiles: Map<string, 'size' | 'budget'>;
};

/**
 * Estimate how much of the context window the next request would consume.
 *
 * Mirrors `prepareTurns` / `collapseCompactedChain`: summarized messages and
 * their attachments are excluded, only the latest compaction summary counts,
 * and compaction markers are not counted as conversation content.
 */
export function estimateEffectiveContextUsage({
    messageChain,
    contextFilters,
    currentAttachments = [],
    allAttachments,
    messageMap,
    budget = getRequestBudget(),
    fileCards = false,
}: EffectiveContextUsageInput): EffectiveContextUsage {
    const summarizedIds = getSummarizedMessageIds(messageChain, messageMap);
    const { summaryTurn, chain: effectiveChain } = collapseCompactedChain(messageChain, messageMap);
    const summaryTokens = summaryTurn ? countTokens(summaryTurn.content ?? '') : 0;
    const { textTokens, toolTokens } = calculateMessageTokenBreakdown(effectiveChain);
    const conversationTokens = textTokens + summaryTokens;
    const toolCallTokens = toolTokens;
    const messageContentTokens = conversationTokens + toolCallTokens;

    const summarizedAttachmentIds = new Set<string>();
    for (const message of messageChain) {
        if (!summarizedIds.has(message.id)) {
            continue;
        }
        message.attachments?.forEach((attachment) => summarizedAttachmentIds.add(attachment.id));
    }

    const unsummarizedCurrentAttachments = currentAttachments.filter(
        (attachment) => !summarizedAttachmentIds.has(attachment.id)
    );

    const {
        files: activeFiles,
        droppedForBudget,
        excerptedForBudget,
        cardedFiles,
    } = resolveRequestContextFiles(
        effectiveChain,
        contextFilters,
        allAttachments,
        unsummarizedCurrentAttachments,
        getFileTokenBudget(budget, messageContentTokens),
        fileCards ? fileCardPolicy : undefined
    );

    const fileTokens = calculateAttachmentContextSize(activeFiles);

    return {
        conversationTokens,
        toolCallTokens,
        fileTokens,
        usedTokens: messageContentTokens + fileTokens,
        hasCompaction: summarizedIds.size > 0,
        activeFiles,
        droppedForBudget,
        excerptedForBudget,
        cardedFiles,
    };
}
