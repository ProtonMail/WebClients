import { DEFAULT_CONTEXT_LIMITS, DEFAULT_CONTEXT_WINDOW_CONFIG } from './contextLimits';

export type ContextSegmentId = 'conversation' | 'tool_calls' | 'files' | 'buffer' | 'free';

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
    toolCallTokens?: number;
    fileTokens: number;
    maxTokens?: number;
    /** Headroom reserved so auto-compaction can trigger before the hard limit. */
    bufferTokens?: number;
    /** Proactive compaction threshold for this model; defaults to the legacy fixed window. */
    proactiveCompactionThresholdTokens?: number;
};

/**
 * Turn measured token contributions into a stacked-bar breakdown of the context
 * window: conversation history, tool calls, files, a reserved auto-compaction buffer,
 * and free space. When usage exceeds the window, segments are scaled to fill the bar
 * and `overCapacity` is set (buffer/free collapse to zero).
 */
export function buildContextBreakdown({
    conversationTokens,
    toolCallTokens = 0,
    fileTokens,
    maxTokens = DEFAULT_CONTEXT_LIMITS.MAX_CONTEXT,
    bufferTokens,
    proactiveCompactionThresholdTokens = DEFAULT_CONTEXT_WINDOW_CONFIG.proactiveCompactionThresholdTokens,
}: ContextBreakdownInput): ContextBreakdown {
    const max = Math.max(1, maxTokens);
    const reservedBuffer = Math.max(0, bufferTokens ?? max - proactiveCompactionThresholdTokens);

    const conversation = Math.max(0, conversationTokens);
    const toolCalls = Math.max(0, toolCallTokens);
    const files = Math.max(0, fileTokens);
    const used = conversation + toolCalls + files;
    const overCapacity = used > max;

    // Over capacity: scale the real segments to fill the bar; otherwise lay them
    // out against the full window with the reserved buffer and remaining free space.
    const denominator = overCapacity ? used : max;
    const toPercentage = (tokens: number) => (denominator > 0 ? (tokens / denominator) * 100 : 0);

    const effectiveBuffer = overCapacity ? 0 : Math.min(reservedBuffer, Math.max(0, max - used));
    const free = overCapacity ? 0 : Math.max(0, max - used - effectiveBuffer);

    const segments: ContextSegment[] = [
        { id: 'conversation', tokens: conversation, percentage: toPercentage(conversation) },
        { id: 'tool_calls', tokens: toolCalls, percentage: toPercentage(toolCalls) },
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
