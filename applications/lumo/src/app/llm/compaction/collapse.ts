import { isCompactionMessage, type Message, Role, type Turn } from '../../types';

export type CollapsedChain = {
    /** Leading system turn carrying the compaction summary, or null if the chain has no boundary. */
    summaryTurn: Turn | null;
    /** The chain with summarized messages and all compaction markers removed. */
    chain: Message[];
};

const SUMMARY_TURN_PREFIX =
    '[Conversation summary — earlier messages were condensed to fit the context window. ' +
    'Treat the following as an accurate record of the prior conversation.]';

/**
 * Apply any context-compaction boundary present in a linear chain, producing the
 * effective message list to send to the model. Every message collapsed by a
 * boundary (across all boundaries, in case of repeated compaction) is dropped,
 * the boundary markers themselves are dropped, and the latest boundary's summary
 * is surfaced as a leading system turn.
 *
 * The original `chain` is never mutated, so the full history remains intact for
 * display while the model only ever sees the compacted view going forward.
 */
export function collapseCompactedChain(chain: Message[]): CollapsedChain {
    const boundaries = chain.filter(isCompactionMessage);
    if (boundaries.length === 0) {
        return { summaryTurn: null, chain };
    }

    const summarizedIds = new Set<string>();
    for (const boundary of boundaries) {
        for (const id of boundary.compaction!.summarizedMessageIds) {
            summarizedIds.add(id);
        }
    }

    // The latest boundary's summary subsumes any earlier ones.
    const latestBoundary = boundaries[boundaries.length - 1];
    const summary = latestBoundary.compaction!.summary;

    const filtered = chain.filter((message) => !summarizedIds.has(message.id) && !isCompactionMessage(message));

    const summaryTurn: Turn = {
        role: Role.System,
        content: `${SUMMARY_TURN_PREFIX}\n\n${summary}`,
    };

    return { summaryTurn, chain: filtered };
}
