import type { Attachment, Message } from '../../types';
import { KEEP_MIN_RECENT_MESSAGES, KEEP_RECENT_TOKEN_BUDGET } from './constants';
import {
    type AttachmentExclusion,
    estimateMessageAttachmentTokens,
    estimateMessageContentTokens,
    estimateMessageTokens,
} from './tokens';

export type ChainPartition = {
    /** Older messages that will be collapsed into a single summary. Always non-empty. */
    head: Message[];
    /** Recent messages preserved verbatim after the compaction boundary. Always non-empty. */
    tail: Message[];
};

export class NotEnoughToCompactError extends Error {
    constructor() {
        super('Not enough messages to compact');
        this.name = 'NotEnoughToCompactError';
    }
}

/**
 * Split an ordered message chain into a `head` (to be summarized) and a `tail`
 * (kept verbatim). The tail grows from the end until it exceeds the recent-token
 * budget while honouring a minimum recent-message count. Both partitions are
 * guaranteed non-empty; a chain too short to split throws.
 *
 * Tool call/result pairs are interleaved blocks inside a single assistant
 * message, so splitting at message boundaries never separates a pair.
 */
function estimatePartitionTokens(
    message: Message,
    attachments: Attachment[],
    exclusions: AttachmentExclusion[]
): number {
    if (attachments.length > 0) {
        return (
            estimateMessageContentTokens(message) +
            estimateMessageAttachmentTokens(message, attachments, exclusions)
        );
    }
    return estimateMessageTokens(message);
}

export function partitionChain(
    messages: Message[],
    opts: {
        keepRecentTokenBudget?: number;
        keepMinRecentMessages?: number;
        attachments?: Attachment[];
        contextFilters?: AttachmentExclusion[];
    } = {}
): ChainPartition {
    const keepRecentTokenBudget = opts.keepRecentTokenBudget ?? KEEP_RECENT_TOKEN_BUDGET;
    const keepMinRecentMessages = opts.keepMinRecentMessages ?? KEEP_MIN_RECENT_MESSAGES;
    const attachments = opts.attachments ?? [];
    const exclusions = opts.contextFilters ?? [];

    if (messages.length < 2) {
        throw new NotEnoughToCompactError();
    }

    // Walk backwards growing the tail, stopping *before* the message that would push it
    // over the budget. Only the minimum-recent-message guarantee can exceed the budget —
    // otherwise one file-heavy message would drag the whole tail (and its attachments)
    // past the budget, leaving compaction nothing worth reclaiming.
    let accumulatedTokens = 0;
    let splitIndex = messages.length; // tail = messages[splitIndex..]
    for (let i = messages.length - 1; i >= 1; i--) {
        const messageTokens = estimatePartitionTokens(messages[i], attachments, exclusions);
        const keptCount = messages.length - i;
        const exceedsBudget = accumulatedTokens + messageTokens > keepRecentTokenBudget;
        const requiredForMinimum = keptCount <= keepMinRecentMessages;

        if (exceedsBudget && !requiredForMinimum) {
            break;
        }

        accumulatedTokens += messageTokens;
        splitIndex = i;
    }

    // Clamp so both head and tail are non-empty.
    splitIndex = Math.min(Math.max(splitIndex, 1), messages.length - 1);

    return {
        head: messages.slice(0, splitIndex),
        tail: messages.slice(splitIndex),
    };
}
