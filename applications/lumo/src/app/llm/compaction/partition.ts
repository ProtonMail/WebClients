import type { Message } from '../../types';
import { KEEP_MIN_RECENT_MESSAGES, KEEP_RECENT_TOKEN_BUDGET } from './constants';
import { estimateMessageTokens } from './tokens';

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
export function partitionChain(
    messages: Message[],
    opts: { keepRecentTokenBudget?: number; keepMinRecentMessages?: number } = {}
): ChainPartition {
    const keepRecentTokenBudget = opts.keepRecentTokenBudget ?? KEEP_RECENT_TOKEN_BUDGET;
    const keepMinRecentMessages = opts.keepMinRecentMessages ?? KEEP_MIN_RECENT_MESSAGES;

    if (messages.length < 2) {
        throw new NotEnoughToCompactError();
    }

    // Walk backwards accumulating the tail until the budget is exhausted.
    let accumulatedTokens = 0;
    let splitIndex = messages.length; // tail = messages[splitIndex..]
    for (let i = messages.length - 1; i >= 0; i--) {
        const keptCount = messages.length - i;
        accumulatedTokens += estimateMessageTokens(messages[i]);
        splitIndex = i;
        if (keptCount >= keepMinRecentMessages && accumulatedTokens > keepRecentTokenBudget) {
            break;
        }
    }

    // Clamp so both head and tail are non-empty.
    splitIndex = Math.min(Math.max(splitIndex, 1), messages.length - 1);

    return {
        head: messages.slice(0, splitIndex),
        tail: messages.slice(splitIndex),
    };
}
