import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import { CONTEXT_LENGTH_EXCEEDED_CODE } from '../../types-api';

/**
 * Raised when the upstream model reports that the conversation no longer fits in
 * its context window. On `/ai/v1/chat/completions` this can surface in two ways:
 *
 *  1. In-stream (normalised OpenAI error shape):
 *       data:{"error":{"code":"context_length_exceeded","type":"invalid_request_error",...}}
 *       data:[DONE]
 *
 *  2. Pre-stream (verbatim vLLM body forwarded unchanged):
 *       HTTP 400 {"object":"error","type":"BadRequestError","message":"...maximum context length...",...}
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

function isVllmPreStreamContextLengthBody(data: unknown): boolean {
    if (!data || typeof data !== 'object') {
        return false;
    }

    const body = data as Record<string, unknown>;
    return body.type === 'BadRequestError' && body.object === 'error';
}

function hasNormalisedContextLengthCode(data: unknown): boolean {
    if (!data || typeof data !== 'object') {
        return false;
    }

    const error = (data as Record<string, unknown>).error;
    if (!error || typeof error !== 'object') {
        return false;
    }

    return (error as Record<string, unknown>).code === CONTEXT_LENGTH_EXCEEDED_CODE;
}

export function getContextLengthExceededUpstreamMessage(error: any): string | undefined {
    const data = error?.data;
    if (!data || typeof data !== 'object') {
        return undefined;
    }

    if (typeof data.message === 'string') {
        return data.message;
    }

    const nested = data.error;
    if (nested && typeof nested === 'object' && typeof (nested as Record<string, unknown>).message === 'string') {
        return (nested as Record<string, unknown>).message as string;
    }

    return undefined;
}

/**
 * Detect a `context_length_exceeded` signal in a raw HTTP error thrown before
 * (or instead of) an SSE stream.
 */
export function isContextLengthExceededApiError(error: any): boolean {
    if (!error) {
        return false;
    }

    if (isVllmPreStreamContextLengthBody(error.data)) {
        return true;
    }

    if (typeof error.data === 'string') {
        try {
            if (isVllmPreStreamContextLengthBody(JSON.parse(error.data))) {
                return true;
            }
        } catch {
            // Ignore malformed JSON bodies.
        }
    }

    if (hasNormalisedContextLengthCode(error.data)) {
        return true;
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
