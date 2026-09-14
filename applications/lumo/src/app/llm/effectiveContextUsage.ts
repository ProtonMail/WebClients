import type { ContextFilter } from './contextFilter';
import { collapseCompactedChain } from './compaction/collapse';
import { getSummarizedMessageIds } from './compaction';
import { resolveRequestContextFiles } from './requestContextFiles';
import { countTokens } from './tokenizer';
import { calculateAttachmentContextSize, calculateMessageContentTokens, computeFileTokenBudget } from './utils';
import type { Attachment, Message, MessageId } from '../types';

export type EffectiveContextUsageInput = {
    /** Active fork linear chain (from preferred siblings). */
    messageChain: Message[];
    contextFilters: ContextFilter[];
    currentAttachments?: Attachment[];
    allAttachments: Record<string, Attachment>;
    /** Conversation-scoped messages; enables shared-history compaction on edit forks. */
    messageMap?: Record<MessageId, Message>;
};

export type EffectiveContextUsage = {
    /** Message text plus the latest compaction summary (post-compaction view). */
    conversationTokens: number;
    /** Attachments that would be sent on the next request. */
    fileTokens: number;
    usedTokens: number;
    hasCompaction: boolean;
    activeFiles: Attachment[];
    /** Files held back because they no longer fit the request's file budget. */
    droppedForBudget: Attachment[];
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
}: EffectiveContextUsageInput): EffectiveContextUsage {
    const summarizedIds = getSummarizedMessageIds(messageChain, messageMap);
    const { summaryTurn, chain: effectiveChain } = collapseCompactedChain(messageChain, messageMap);
    const summaryTokens = summaryTurn ? countTokens(summaryTurn.content ?? '') : 0;
    const conversationTokens = calculateMessageContentTokens(effectiveChain) + summaryTokens;

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

    const { files: activeFiles, droppedForBudget } = resolveRequestContextFiles(
        effectiveChain,
        contextFilters,
        allAttachments,
        unsummarizedCurrentAttachments,
        computeFileTokenBudget(conversationTokens)
    );

    const fileTokens = calculateAttachmentContextSize(activeFiles);

    return {
        conversationTokens,
        fileTokens,
        usedTokens: conversationTokens + fileTokens,
        hasCompaction: summarizedIds.size > 0,
        activeFiles,
        droppedForBudget,
    };
}
