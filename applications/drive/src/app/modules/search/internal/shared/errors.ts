import type { ScopeContext } from '@sentry/types';
import { c } from 'ttag';

import {
    AbortError as SdkAbortError,
    ConnectionError as SdkConnectionError,
    RateLimitedError as SdkRateLimitedError,
    ServerError as SdkServerError,
} from '@proton/drive';
import { sendErrorReport } from '@proton/drive/legacy/errorHandling';
import { getNotificationsManager } from '@proton/drive/modules/notifications';
import {
    getIsNetworkError,
    getIsOfflineError,
    getIsTimeoutError,
    getIsUnreachableError,
} from '@proton/shared/lib/api/helpers/apiErrorHelper';

import { Logger } from './Logger';

// Sentry is not installed on the sharedworker.
// This channel is used to forward errors from the sharedworker to the main thread for Sentry reporting.
const ERROR_CHANNEL = 'search-module-errors';
const isWorker = typeof SharedWorkerGlobalScope !== 'undefined';

/** Errror payload sent over BroadcastChannel from the SharedWorker to the main thread. */
type WorkerErrorMessage = {
    error: Error;
    context: Partial<ScopeContext>;
};

/**
 * Reports a search error to Sentry with search metadata.
 *
 * In the SharedWorker, errors are forwarded to the main thread via BroadcastChannel
 * because Sentry is only initialized on the main thread.
 * Call `listenForWorkerErrors()` once on the main thread to subscribe.
 */
export function sendErrorReportForSearch(
    message: string,
    error: Error | unknown,
    additionalContext?: Partial<ScopeContext>
) {
    // Defense in depth: never forward offline errors to Sentry. The indexer queue
    // also filters these structurally, but a stray callsite shouldn't flood telemetry
    // when the user briefly drops connectivity.
    if (getIsOfflineError(error)) {
        return;
    }

    // Normalize into a proper Error and build a shared Sentry context
    // so both the worker (BroadcastChannel) and main-thread paths report identical metadata.
    const normalizedError = error instanceof Error ? error : new Error(String(error));
    const context: Partial<ScopeContext> = {
        ...additionalContext,
        extra: { message, ...additionalContext?.extra },
        tags: { component: 'search', ...additionalContext?.tags },
    };

    if (isWorker) {
        try {
            const channel = new BroadcastChannel(ERROR_CHANNEL);
            channel.postMessage({ error: normalizedError, context } satisfies WorkerErrorMessage);
            channel.close();
        } catch (e) {
            // BroadcastChannel can fail if the worker is shutting down.
            Logger.error('Failed to forward error report via BroadcastChannel', e);
        }
        return;
    }

    sendErrorReport(normalizedError, context);
}

/**
 * Call once on the main thread to forward worker error reports to Sentry.
 */
export function listenForWorkerErrors() {
    if (isWorker) {
        return;
    }
    const channel = new BroadcastChannel(ERROR_CHANNEL);
    channel.onmessage = (e: MessageEvent<WorkerErrorMessage>) => {
        sendErrorReport(e.data.error, e.data.context);
    };
}

export function isAbortError(e: unknown): boolean {
    // DOMException covers fetch/AbortController aborts; SdkAbortError covers SDK-thrown aborts
    // that never crossed a serialization boundary. The plain-Error/name check covers the same
    // SDK AbortError after crossing the main-thread <-> SharedWorker Comlink boundary: structured
    // clone (see comlinkErrorTransferHandler.ts) preserves `.name`/`.message` but not custom
    // subclass identity, so `instanceof SdkAbortError` no longer holds on the worker side.
    return (
        (e instanceof DOMException && e.name === 'AbortError') ||
        e instanceof SdkAbortError ||
        (e instanceof Error && e.name === 'AbortError')
    );
}

export function isQuotaExceededError(e: unknown): boolean {
    return e instanceof DOMException && e.name === 'QuotaExceededError';
}

/**
 * Thrown when the SharedWorker connection is lost (crash, OOM, killed by user)
 * and the client is reconnecting.
 */
export class SearchWorkerDisconnectedError extends Error {
    constructor() {
        super('Search SharedWorker disconnected');
        this.name = 'SearchWorkerDisconnectedError';
    }
}

/**
 * Thrown when the SharedWorker heartbeat times out, indicating the worker
 * is unresponsive (frozen, deadlocked, or extremely slow).
 */
export class SharedWorkerHeartbeatTimeout extends Error {
    constructor() {
        super('SharedWorker heartbeat timeout');
        this.name = 'SharedWorkerHeartbeatTimeout';
    }
}

/**
 * Thrown when getDb is called with a userId that differs from the one the worker's
 * SearchDB was opened for. The SharedWorker is namespaced per user, so this must never
 * happen - if it does, an isolation invariant is broken and we fail hard rather than
 * risk operating on another user's index.
 */
export class SearchDBUserMismatchError extends Error {
    constructor() {
        super('SearchDB was opened for a different user than the one requested');
        this.name = 'SearchDBUserMismatchError';
    }
}

export class InvalidIndexerState extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidIndexerState';
    }
}

export class InvalidSearchModuleState extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidSearchModuleState';
    }
}

/**
 * Thrown when the search library WASM raises an error.
 */
export class SearchLibraryError extends Error {
    constructor(
        message: string,
        readonly cause: unknown
    ) {
        super(message, { cause });
        this.name = 'SearchLibraryError';
    }
}

/**
 * Thrown when an index blob fails to encrypt or decrypt.
 */
export class SearchBlobCryptoError extends Error {
    constructor(readonly cause: unknown) {
        super('Failed to encrypt or decrypt search index blob', { cause });
        this.name = 'SearchBlobCryptoError';
    }
}

/**
 * Thrown when a tree scope is removed (tree_remove signal).
 * Handled gracefully — entries are cleaned up, scope unregistered, processor continues.
 */
export class ScopeRemovedError extends Error {
    constructor(readonly treeEventScopeId: string) {
        super(`Tree removed for scope ${treeEventScopeId}`);
        this.name = 'ScopeRemovedError';
    }
}

export const createQuotaExceededErrorMessage = async () => {
    const { usage, quota } = await navigator.storage.estimate();
    const usageMB = ((usage ?? 0) / 1024 / 1024).toFixed(1);
    const quotaMB = ((quota ?? 0) / 1024 / 1024).toFixed(1);
    return `${usageMB}MB / ${quotaMB}MB`;
};

/**
 * Thrown when attempting to subscribe to tree events for a scope that already has
 * an active subscription.
 */
export class DuplicateEventSubscriptionError extends Error {
    constructor(treeEventScopeId: string) {
        super(`Already subscribed to tree events for scope ${treeEventScopeId}`);
        this.name = 'DuplicateEventSubscriptionError';
    }
}

/**
 * Returns true for transient IndexedDB errors where the transaction timed out
 * or was aborted by the browser under memory pressure. Safe to retry.
 */
export function isTransactionInactiveError(e: unknown): boolean {
    return e instanceof DOMException && e.name === 'TransactionInactiveError';
}

/**
 * Returns true for IndexedDB errors that indicate the database is corrupted
 * or was tampered with and requires a full reset (delete DB + rebuild engine).
 *
 * - InvalidStateError: DB connection lost (deleted externally)
 * - VersionError: schema version mismatch (downgrade)
 * - DataError: invalid keys (tampered data)
 * - DataCloneError: unserializable values (tampered data)
 */
export function isCorruptedDBError(e: unknown): boolean {
    if (!(e instanceof DOMException)) {
        return false;
    }
    return (
        e.name === 'InvalidStateError' ||
        e.name === 'VersionError' ||
        e.name === 'DataError' ||
        e.name === 'DataCloneError'
    );
}

export type PermanentErrorKind =
    'quota_exceeded' | 'corrupted_db' | 'invalid_indexer_state' | 'search_library_error' | 'search_crypto_error';

/**
 * Thrown when the user's OpenPGP keys are unavailable or cannot decrypt the stored
 * search encryption key. Wraps the original error as `cause`.
 */
export class MissingUserKeyEncryptionError extends Error {
    constructor(cause?: unknown) {
        super('User encryption keys unavailable for search index', { cause });
        this.name = 'MissingUserKeyEncryptionError';
    }
}

/**
 * Classifies a permanent error into a specific kind, or returns null if the error
 * is not permanent. Permanent errors are unrecoverable and permanently stop the task
 * processor; they require user intervention (free disk space, clear DB, etc).
 */
export function classifyPermanentError(e: unknown): PermanentErrorKind | null {
    if (isQuotaExceededError(e)) {
        return 'quota_exceeded';
    }
    if (isCorruptedDBError(e)) {
        return 'corrupted_db';
    }

    if (e instanceof SearchBlobCryptoError || e instanceof MissingUserKeyEncryptionError) {
        return 'search_crypto_error';
    }
    if (e instanceof InvalidIndexerState) {
        return 'invalid_indexer_state';
    }
    if (e instanceof SearchLibraryError) {
        return 'search_library_error';
    }
    return null;
}

/**
 * Wraps an async or sync function and shows a user-facing notification.
 * It should be used for any function that is triggered by the user.
 */
export function tryCatchWithNotification<T>(fn: () => T | Promise<T>): () => Promise<T | void> {
    return async () => {
        try {
            return await fn();
        } catch (error) {
            sendErrorReportForSearch('Search error', error);

            // TODO: Handle more error types.
            const text = isQuotaExceededError(error)
                ? c('Error').t`Something went wrong with search: Not enough storage space.`
                : c('Error').t`Something went wrong with search. Please try again later.`;
            getNotificationsManager().createNotification({ text, type: 'error' });
        }
    };
}

export type TransientErrorKind = 'rate-limited' | 'server' | 'network' | 'offline' | 'abort' | 'unknown';

export type ErrorDecision =
    { kind: 'permanent'; reason: PermanentErrorKind } | { kind: 'transient'; reason: TransientErrorKind };

/**
 * Classifies an error into one of two buckets driving the queue's reaction:
 * - permanent: stop the queue (existing behavior, e.g. quota / corrupted DB)
 * - transient: per-task delay and retry
 */
export function classifyError(e: unknown): ErrorDecision {
    const permanent = classifyPermanentError(e);
    if (permanent) {
        return { kind: 'permanent', reason: permanent };
    }
    // Abort is checked before other transients so it never silently buckets as 'unknown'.
    // The IndexerTaskQueue short-circuits aborts before calling classifyError, so this branch
    // is defensive completeness rather than the live path.
    if (isAbortError(e)) {
        return { kind: 'transient', reason: 'abort' };
    }
    // NOTE: As of may-2026, the SdkConnectionError is never used or thrown by he SDK. It only
    // throws an error with the name "OfflineError". We add it for forward-comaptibility only.
    if (e instanceof SdkConnectionError || getIsOfflineError(e)) {
        return { kind: 'transient', reason: 'offline' };
    }
    // Same Comlink boundary problem as isAbortError above: RateLimitedError/ServerError thrown by
    // the SDK on the main thread and crossed back to the worker lose their subclass identity, so
    // instanceof alone misses them. Fall back to the name preserved by structured clone.
    if (e instanceof SdkRateLimitedError || (e instanceof Error && e.name === 'RateLimitedError')) {
        return { kind: 'transient', reason: 'rate-limited' };
    }
    if (e instanceof SdkServerError || (e instanceof Error && e.name === 'ServerError') || getIsUnreachableError(e)) {
        return { kind: 'transient', reason: 'server' };
    }
    if (getIsNetworkError(e) || getIsTimeoutError(e)) {
        return { kind: 'transient', reason: 'network' };
    }

    return { kind: 'transient', reason: 'unknown' };
}

/**
 * A repairable error IS the node's fault and is safe to quarantine to the repair table and retry:
 * `classifyError`'s transient-`unknown` bucket (decryption, entry mapping, parent-path resolution,
 * other deterministic per-node failures) is node-scoped and safe to quarantine + skip.
 *
 * Everything else is systemic and must NOT be quarantined:
 * - abort (queue is stopping),
 * - known transient network-family reasons (offline / network / server / rate-limited) - the whole
 *   batch should be retried, not the node skipped,
 * - permanent errors (quota / corrupted DB / invalid state / WASM engine) - the queue stops.
 */
export function isRepairableError(e: unknown): boolean {
    if (isAbortError(e)) {
        return false;
    }
    const decision = classifyError(e);
    if (decision.kind === 'permanent') {
        return false;
    }
    return decision.reason === 'unknown';
}

/**
 * Max number of Sentry reports per burst before silencing further ones to avoid spam. Shared by
 * every per-key burst throttle in searchMetrics (transient task errors, node quarantine, ...).
 */
export const SENTRY_REPORT_BURST_MAX_ATTEMPTS = 5;

/**
 * Window after which a new burst of reports is allowed for the same key.
 * Keeps ongoing issues visible without flooding Sentry.
 */
export const SENTRY_REPORT_BURST_WINDOW_MS = 600_000; // 10 minutes

/** Default retry delay applied to rate-limited errors. */
export const DEFAULT_RETRY_AFTER_IN_MS = 600_000; // 10 minutes

// Hand-tuned backoff schedule.
const BACKOFF_SCHEDULE_MS: readonly number[] = [
    1_000, // attempt 1
    2_000, // attempt 2
    5_000, // attempt 3
    10_000, // attempt 4
    30_000, // attempt 5
    60_000, // attempt 6+
];

/**
 * Returns the backoff delay for the given 1-based attempt number, with ±20% jitter
 * to smear out concurrent retries.
 */
export function computeBackoff(attempt: number): number {
    const idx = Math.min(Math.max(attempt, 1) - 1, BACKOFF_SCHEDULE_MS.length - 1);
    const base = BACKOFF_SCHEDULE_MS[idx];
    const jitter = 0.8 + Math.random() * 0.4;
    return Math.round(base * jitter);
}
