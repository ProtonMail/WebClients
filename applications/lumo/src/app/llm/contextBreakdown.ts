import { PROACTIVE_COMPACTION_THRESHOLD_TOKENS } from './compaction';
import { CONTEXT_LIMITS } from './utils';

export type ContextSegmentId = 'conversation' | 'files' | 'buffer' | 'free';

export type ContextSegment = {
    id: ContextSegmentId;
    tokens: number;
    /** Width as a percentage of the bar (0–100), already clamped for over-capacity. */
    percentage: number;
};

export type ContextBreakdown = {
    maxTokens: number;
    usedTokens: number;
    bufferTokens: number;
    freeTokens: number;
    /** Used / max as a percentage; may exceed 100 when over capacity. */
    percentageUsed: number;
    overCapacity: boolean;
    segments: ContextSegment[];
};

export type ContextBreakdownInput = {
    conversationTokens: number;
    fileTokens: number;
    maxTokens?: number;
    /** Headroom reserved so auto-compaction can trigger before the hard limit. */
    bufferTokens?: number;
};

/**
 * Turn measured token contributions into a stacked-bar breakdown of the context
 * window: conversation history, files, a reserved auto-compaction buffer, and
 * free space. When usage exceeds the window, segments are scaled to fill the bar
 * and `overCapacity` is set (buffer/free collapse to zero).
 */
export function buildContextBreakdown({
    conversationTokens,
    fileTokens,
    maxTokens = CONTEXT_LIMITS.MAX_CONTEXT,
    bufferTokens,
}: ContextBreakdownInput): ContextBreakdown {
    const max = Math.max(1, maxTokens);
    const reservedBuffer = Math.max(0, bufferTokens ?? max - PROACTIVE_COMPACTION_THRESHOLD_TOKENS);

    const conversation = Math.max(0, conversationTokens);
    const files = Math.max(0, fileTokens);
    const used = conversation + files;
    const overCapacity = used > max;

    // Over capacity: scale the real segments to fill the bar; otherwise lay them
    // out against the full window with the reserved buffer and remaining free space.
    const denominator = overCapacity ? used : max;
    const toPercentage = (tokens: number) => (denominator > 0 ? (tokens / denominator) * 100 : 0);

    const effectiveBuffer = overCapacity ? 0 : Math.min(reservedBuffer, Math.max(0, max - used));
    const free = overCapacity ? 0 : Math.max(0, max - used - effectiveBuffer);

    const segments: ContextSegment[] = [
        { id: 'conversation', tokens: conversation, percentage: toPercentage(conversation) },
        { id: 'files', tokens: files, percentage: toPercentage(files) },
        { id: 'buffer', tokens: effectiveBuffer, percentage: toPercentage(effectiveBuffer) },
        { id: 'free', tokens: free, percentage: toPercentage(free) },
    ];

    return {
        maxTokens: max,
        usedTokens: used,
        bufferTokens: effectiveBuffer,
        freeTokens: free,
        percentageUsed: Math.round((used / max) * 100),
        overCapacity,
        segments,
    };
}
