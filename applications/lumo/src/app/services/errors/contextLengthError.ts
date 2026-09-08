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
    if (
        body.type !== 'BadRequestError' ||
        body.object !== 'error' ||
        body.code !== 400 ||
        typeof body.message !== 'string'
    ) {
        return false;
    }

    const message = body.message.toLowerCase();
    return (
        message.includes('maximum context length') ||
        message.includes('context window') ||
        message.includes('too many tokens')
    );
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
    // Raw pre-stream context overflows are only forwarded as HTTP 400.
    // In-stream overflows stay HTTP 200 and are handled from their explicit
    // SSE `context_length_exceeded` code before reaching this function.
    if (!error || error.status !== 400) {
        return false;
    }

    let data = error.data;
    if (typeof error.data === 'string') {
        try {
            data = JSON.parse(error.data);
        } catch {
            return false;
        }
    }

    return isVllmPreStreamContextLengthBody(data) || hasNormalisedContextLengthCode(data);
}
