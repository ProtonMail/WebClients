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
import { getBridgedErrorDecision } from './bridgedErrorDecision';

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
 *
 * Never throws: most callers are `catch`/`finally` blocks, where a throw would mask the error
 * being reported or skip the cleanup that follows.
 */
export function sendErrorReportForSearch(
    message: string,
    error: Error | unknown,
    additionalContext?: Partial<ScopeContext>
) {
    try {
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
    } catch (e) {
        Logger.error('Failed to sendErrorReportForSearch', e);
    }
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
    // Three checks because an abort can be asked about from three different positions:
    // - bridged decision: the receiving side, after a comlink crossing. The subclass is gone and the name
    //   has been flattened, so this is the only thing left to go on.
    // - DOMException: an abort that never crosses at all, which is the live path.
    // - SdkAbortError: the throwing side, before a crossing.
    return (
        getBridgedErrorDecision(e)?.reason === 'abort' ||
        (e instanceof DOMException && e.name === 'AbortError') ||
        e instanceof SdkAbortError
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
 *
 * Position-dependent by design: for an error that crossed the Comlink boundary the answer comes
 * from the decision computed on the far side, because nothing local could reconstruct it. Callers
 * on the throwing side classify from the error itself.
 */
export function classifyError(e: unknown): ErrorDecision {
    // RECEIVING SIDE ONLY. Set by the transfer handler for anything that crossed the bridge, and
    // authoritative when present: it was computed where the error still had its identity, which no
    // check below could now reconstruct. First, so the later probes never contradict it.
    const bridged = getBridgedErrorDecision(e);
    if (bridged) {
        return bridged;
    }

    // WORKER, LOCAL. Quota, corrupted DB, WASM and blob-crypto failures all originate here, from
    // IndexedDB or the search engine, so they never cross a bridge. The two DOMException-based ones
    // would survive a crossing anyway, since a DOMException keeps its `name`.
    const permanent = classifyPermanentError(e);
    if (permanent) {
        return { kind: 'permanent', reason: permanent };
    }

    // EITHER SIDE. The worker's own signal throws a DOMException locally; an SDK abort is caught
    // here on the throwing side. Checked before the other transients so a cancelled operation is
    // never mistaken for a failed one, which would get a node quarantined during shutdown.
    // IndexerTaskQueue short-circuits its own aborts before calling this, so this is completeness
    // rather than the live path.
    if (isAbortError(e)) {
        return { kind: 'transient', reason: 'abort' };
    }

    // THROWING SIDE (main thread). Both tests read something a clone destroys: the subclass, and
    // the name 'OfflineError'. Post-crossing this only ever matches via the bridged decision above.
    // NOTE: As of may-2026, the SdkConnectionError is never used or thrown by he SDK. It only
    // throws an error with the name "OfflineError". We add it for forward-comaptibility only.
    if (e instanceof SdkConnectionError || getIsOfflineError(e)) {
        return { kind: 'transient', reason: 'offline' };
    }

    // THROWING SIDE (main thread). Separated from 'server' below only so the queue can apply its
    // long retry delay: retrying a 429 on the normal backoff makes the rate limiting worse.
    // NOTE: RateLimitedError extends ServerError, so it has to be checked first.
    if (e instanceof SdkRateLimitedError) {
        return { kind: 'transient', reason: 'rate-limited' };
    }

    // THROWING SIDE (main thread), but two different error families. The instanceof covers SDK
    // errors; getIsUnreachableError reads `.status`, which is the shape of the legacy Proton API
    // used for the event-id fetch, not the SDK's `statusCode`. So neither is redundant.
    if (e instanceof SdkServerError || getIsUnreachableError(e)) {
        return { kind: 'transient', reason: 'server' };
    }

    // THROWING SIDE (main thread). Legacy fetch shapes again, matched on `name`, so likewise only
    // reachable before a crossing.
    if (getIsNetworkError(e) || getIsTimeoutError(e)) {
        return { kind: 'transient', reason: 'network' };
    }

    // Genuinely unclassifiable: our own bugs, malformed data, and untyped throws from the SDK. Not
    // a synonym for "the node is broken" - see isRepairableError below for why that distinction
    // has to be made by the caller rather than inferred from here.
    return { kind: 'transient', reason: 'unknown' };
}

/**
 * Thrown by the narrow set of call sites that are confirmed to concern exactly one node: its own
 * fetch, entry-mapping, or parent-path resolution. Whether an error is repairable is a property of
 * the *operation* (was this call scoped to a single node?), not of the error's type - a network
 * error fetching this node is still systemic, not this node's fault. Construct via
 * `maybeWrapAsRepairableNodeError` at those call sites rather than throwing directly, so the
 * systemic/known-transient carve-out below is never skipped.
 */
export class RepairableNodeError extends Error {
    constructor(
        message: string,
        readonly cause: unknown
    ) {
        super(message, { cause });
        this.name = 'RepairableNodeError';
    }
}

/**
 * Converts `e` to a `RepairableNodeError` when it is unclassified (`classifyError`'s
 * transient-`unknown` bucket - decryption, entry mapping, other deterministic per-node failures),
 * otherwise returns it unchanged. Known systemic errors (abort, permanent, or a recognized
 * transient network-family reason) concern the whole operation, not this node, and must propagate
 * so the batch is retried rather than the node quarantined.
 *
 * Call this ONLY at a call site scoped to a single node (fetching it, mapping it to an index
 * entry, resolving its own parent path) - never around an operation that can fail partway through
 * on account of a different node (e.g. a subtree walk), or the misattribution this replaces would
 * just move somewhere else.
 */
export function maybeWrapAsRepairableNodeError(e: unknown, message: string): unknown {
    if (isAbortError(e)) {
        return e;
    }
    const decision = classifyError(e);
    if (decision.kind === 'permanent' || decision.reason !== 'unknown') {
        return e;
    }
    return new RepairableNodeError(message, e);
}

/** Safe to quarantine to the repair table and retry independently; see `RepairableNodeError`. */
export function isRepairableError(e: unknown): boolean {
    return e instanceof RepairableNodeError;
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
