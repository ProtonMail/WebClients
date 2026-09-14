import { type Message, type MessageId, isCompactionMessage } from '../../types';

/** Compaction boundary markers present in a linear chain, in chronological order. */
export function getCompactionBoundaries(messageChain: Message[]): Message[] {
    return messageChain.filter(isCompactionMessage);
}

function getDoneCompactionBoundariesInChain(messageChain: Message[]): Message[] {
    return getCompactionBoundaries(messageChain).filter((boundary) => boundary.compaction?.status !== 'compacting');
}

/**
 * A boundary is usable on a chain only when what it summarized is exactly the oldest
 * run of that chain. Anything else — a gap in the middle, or messages belonging to a
 * diverged fork — would drop history out of order, so it is rejected.
 */
function summarizesPrefixOf(boundary: Message, chainMessageIds: MessageId[]): boolean {
    const summarized = boundary.compaction?.summarizedMessageIds ?? [];
    if (summarized.length === 0 || summarized.length >= chainMessageIds.length) {
        return false;
    }

    const summarizedSet = new Set(summarized);
    if (summarizedSet.size !== summarized.length) {
        return false;
    }

    return chainMessageIds.slice(0, summarized.length).every((id) => summarizedSet.has(id));
}

/**
 * When a user message is edited the new fork is a sibling of the original, so the
 * original's compaction boundary hangs off a message that is not on this fork's parent
 * walk. The history *before* the edit is still shared, so that boundary can be reused —
 * but only when it summarized a clean prefix of this chain.
 *
 * Reusing it is what keeps the two forks of one conversation in agreement: without it an
 * edited fork re-counts history the sibling already summarized. Requiring a prefix match
 * is what makes the rule symmetric — a boundary produced after the fork diverged names
 * messages absent from the other chain and is therefore never applied to it.
 */
export function getSharedHistoryCompactionBoundary(
    messageChain: Message[],
    messageMap: Record<MessageId, Message>
): Message | undefined {
    if (getDoneCompactionBoundariesInChain(messageChain).length > 0) {
        return undefined;
    }

    const chainMessageIds = messageChain.filter((message) => !isCompactionMessage(message)).map((m) => m.id);
    const chainIds = new Set(messageChain.map((message) => message.id));

    const applicable = Object.values(messageMap).filter(
        (candidate) =>
            isCompactionMessage(candidate) &&
            candidate.compaction?.status !== 'compacting' &&
            Boolean(candidate.compaction?.summary) &&
            !chainIds.has(candidate.id) &&
            summarizesPrefixOf(candidate, chainMessageIds)
    );

    if (applicable.length === 0) {
        return undefined;
    }

    // Longest applicable prefix reclaims the most; createdAt only breaks ties, so both
    // forks of a conversation resolve to the same boundary regardless of visit order.
    return applicable
        .sort((a, b) => {
            const lengthDelta = a.compaction!.summarizedMessageIds.length - b.compaction!.summarizedMessageIds.length;
            if (lengthDelta !== 0) {
                return lengthDelta;
            }
            return new Date(a.compaction!.createdAt).getTime() - new Date(b.compaction!.createdAt).getTime();
        })
        .at(-1);
}

/** The most recent compaction boundary for this fork; its summary is the only one sent to the model. */
export function getLatestCompactionBoundary(
    messageChain: Message[],
    messageMap?: Record<MessageId, Message>
): Message | undefined {
    const boundaries = getCompactionBoundaries(messageChain);

    for (let i = boundaries.length - 1; i >= 0; i--) {
        if (boundaries[i].compaction?.status !== 'compacting') {
            return boundaries[i];
        }
    }

    // Every boundary in the chain is still compacting, so nothing here is usable yet.
    if (messageMap) {
        const shared = getSharedHistoryCompactionBoundary(messageChain, messageMap);
        if (shared) {
            return shared;
        }
    }

    return boundaries[boundaries.length - 1];
}

/** Message ids folded into a compaction summary on this fork and no longer sent to the model. */
export function getSummarizedMessageIds(
    messageChain: Message[],
    messageMap?: Record<MessageId, Message>
): Set<MessageId> {
    const ids = new Set<MessageId>();
    for (const message of messageChain) {
        if (message.compaction?.status === 'compacting') {
            continue;
        }
        message.compaction?.summarizedMessageIds.forEach((id) => ids.add(id));
    }

    if (messageMap) {
        const shared = getSharedHistoryCompactionBoundary(messageChain, messageMap);
        shared?.compaction?.summarizedMessageIds.forEach((id) => ids.add(id));
    }

    return ids;
}

export function isSummarizedMessage(
    messageId: MessageId,
    messageChain: Message[],
    messageMap?: Record<MessageId, Message>
): boolean {
    return getSummarizedMessageIds(messageChain, messageMap).has(messageId);
}
