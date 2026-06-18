import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import { CONTEXT_LENGTH_EXCEEDED_CODE } from '../../types-api';

/**
 * Raised when the upstream model reports that the conversation no longer fits in
 * its context window. This can surface in two ways on the chat stream:
 *
 *  1. A mid-stream SSE event:
 *       data:{"type":"tool-error","error":{"code":"context_length_exceeded",...}}
 *       data:[DONE]
 *
 *  2. A plain HTTP 400 response whose body carries the same code.
 *
 * Both are normalised into this error so the orchestration layer can trigger
 * context compaction and transparently retry the generation.
 */
export class ContextLengthExceededError extends Error {
    /** Discriminator so the error survives structuredClone / serialization boundaries. */
    readonly isContextLengthExceeded = true as const;

    conversationId?: string;

    /** Verbatim upstream error body, kept for diagnostics only (never surfaced raw to the user). */
    upstreamMessage?: string;

    constructor(opts: { conversationId?: string; upstreamMessage?: string } = {}) {
        super('Context length exceeded');
        this.name = 'ContextLengthExceededError';
        this.conversationId = opts.conversationId;
        this.upstreamMessage = opts.upstreamMessage;
        // Restore prototype chain (transpilation target may break instanceof otherwise).
        Object.setPrototypeOf(this, ContextLengthExceededError.prototype);
    }
}

export function isContextLengthExceededError(error: unknown): error is ContextLengthExceededError {
    return (
        error instanceof ContextLengthExceededError ||
        (typeof error === 'object' && error !== null && (error as any).isContextLengthExceeded === true)
    );
}

/**
 * Detect a `context_length_exceeded` signal in a raw HTTP error thrown before
 * (or instead of) an SSE stream. We match defensively against the structured
 * Proton API error code as well as the raw error/response text, since the
 * upstream body is forwarded verbatim and its exact shape may vary by provider.
 */
export function isContextLengthExceededApiError(error: any): boolean {
    if (!error) {
        return false;
    }

    const { code, message } = getApiError(error);

    const haystacks: (string | undefined)[] = [
        typeof code === 'string' ? code : undefined,
        message,
        error.message,
        typeof error.data === 'string' ? error.data : undefined,
        (() => {
            try {
                return error.data ? JSON.stringify(error.data) : undefined;
            } catch {
                return undefined;
            }
        })(),
    ];

    return haystacks.some((h) => typeof h === 'string' && h.toLowerCase().includes(CONTEXT_LENGTH_EXCEEDED_CODE));
}
