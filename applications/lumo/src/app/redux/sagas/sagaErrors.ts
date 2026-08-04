import type { SagaIterator } from 'redux-saga';
import { call, delay } from 'redux-saga/effects';

export let RETRY_PUSH_EVERY_MS = 30000;

export function setRetryPushEveryMs(ms: number) {
    RETRY_PUSH_EVERY_MS = ms;
}

export class ClientError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, ClientError.prototype);
        this.name = 'ClientError';
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ClientError);
        }
    }
}

export class ConflictClientError extends ClientError {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, ConflictClientError.prototype);
        this.name = 'ConflictClientError';
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ConflictClientError);
        }
    }
}

/**
 * Error thrown when the backend rejects a POST because the user hit a resource
 * limit (messages per conversation, assets per space, conversations per space,
 * spaces per user). The backend signals this via HTTP 422.
 */
export class LimitReachedError extends ClientError {
    public readonly resource: 'messages' | 'assets' | 'conversations' | 'spaces';

    public readonly serverMessage?: string;

    public readonly code?: number;

    constructor(resource: LimitReachedError['resource'], opts: { serverMessage?: string; code?: number } = {}) {
        super(`Limit reached for ${resource}${opts.serverMessage ? `: ${opts.serverMessage}` : ''}`);
        this.resource = resource;
        this.serverMessage = opts.serverMessage;
        this.code = opts.code;
        Object.setPrototypeOf(this, LimitReachedError.prototype);
        this.name = 'LimitReachedError';
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, LimitReachedError);
        }
    }
}

export function isClientError(err: unknown): err is ClientError {
    return err instanceof ClientError;
}

export function isConflictClientError(err: unknown): err is ConflictClientError {
    return err instanceof ConflictClientError;
}

export function isLimitReachedError(err: unknown): err is LimitReachedError {
    return err instanceof LimitReachedError;
}

export function callWithRetry<R>(
    fn: (...args: any[]) => Promise<R>,
    args: any[],
    maxRetries?: number,
    baseDelay?: number
): SagaIterator<R>;
export function callWithRetry<R>(
    fn: (...args: any[]) => SagaIterator<R>,
    args: any[],
    maxRetries?: number,
    baseDelay?: number
): SagaIterator<R>;
export function* callWithRetry<R>(fn: any, args: any[] = [], maxRetries = 3, baseDelay = 500): SagaIterator<R> {
    let attempt = 0;
    while (true) {
        try {
            // works whether fn is an async fn or a generator fn
            return yield call(fn, ...args);
        } catch (err) {
            if (++attempt >= maxRetries) throw err;
            yield delay(baseDelay * 2 ** (attempt - 1));
        }
    }
}
