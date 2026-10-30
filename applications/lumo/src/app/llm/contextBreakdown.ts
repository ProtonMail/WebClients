import { DEFAULT_CONTEXT_LIMITS } from './contextLimits';
import { getReservedOutputTokens } from './requestBudget';

export type ContextSegmentId = 'conversation' | 'tool_calls' | 'files' | 'buffer' | 'free';

type ContextSegment = {
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
    /** Used / (max − reserved reply) as a percentage; may exceed 100 when over capacity. */
    percentageUsed: number;
    /** The next request no longer fits next to the reserved reply. */
    overCapacity: boolean;
    segments: ContextSegment[];
};

export type ContextBreakdownInput = {
    conversationTokens: number;
    toolCallTokens?: number;
    fileTokens: number;
    /** Model window, in the same units as the token counts. */
    maxTokens?: number;
    /** Room reserved for the reply; defaults to the non-reasoning reservation for `maxTokens`. */
    bufferTokens?: number;
};

/**
 * Turn measured token contributions into a stacked-bar breakdown of the context
 * window: conversation history, tool calls, files, the room reserved for the reply,
 * and free space. Usage percentages are against the window minus that reservation —
 * the same denominator as the context indicator — since a request that eats into it
 * no longer fits. When usage exceeds the whole window, segments are scaled to fill
 * the bar (buffer/free collapse to zero).
 */
export function buildContextBreakdown({
    conversationTokens,
    toolCallTokens = 0,
    fileTokens,
    maxTokens = DEFAULT_CONTEXT_LIMITS.MAX_CONTEXT,
    bufferTokens,
}: ContextBreakdownInput): ContextBreakdown {
    const max = Math.max(1, maxTokens);
    const reservedBuffer = Math.min(max - 1, Math.max(0, bufferTokens ?? getReservedOutputTokens(max, false)));
    const usable = max - reservedBuffer;

    const conversation = Math.max(0, conversationTokens);
    const toolCalls = Math.max(0, toolCallTokens);
    const files = Math.max(0, fileTokens);
    const used = conversation + toolCalls + files;
    const overWindow = used > max;

    // Over the whole window: scale the real segments to fill the bar; otherwise lay them
    // out against the full window with the reserved buffer and remaining free space.
    const denominator = overWindow ? used : max;
    const toPercentage = (tokens: number) => (denominator > 0 ? (tokens / denominator) * 100 : 0);

    const effectiveBuffer = overWindow ? 0 : Math.min(reservedBuffer, Math.max(0, max - used));
    const free = overWindow ? 0 : Math.max(0, max - used - effectiveBuffer);

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
        percentageUsed: Math.round((used / usable) * 100),
        overCapacity: used > usable,
        segments,
    };
}
