import type { ScopeContext } from '@sentry/types';

import { sendErrorReport } from '../../../../utils/errorHandling';

export function sendErrorReportForSearch(error: Error | unknown, additionalContext?: Partial<ScopeContext>) {
    sendErrorReport(error, {
        ...additionalContext,
        tags: {
            component: 'search',
            ...additionalContext?.tags,
        },
    });
}

export function isAbortError(e: unknown): boolean {
    return e instanceof DOMException && e.name === 'AbortError';
}

export function isQuotaExceededError(e: unknown): boolean {
    return e instanceof DOMException && e.name === 'QuotaExceededError';
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

/**
 * Returns true for errors that are unrecoverable and should permanently stop the
 * task processor. These errors require user intervention (free disk space, clear DB, etc).
 */
export function isPermanentError(e: unknown): boolean {
    return (
        e instanceof InvalidIndexerState ||
        e instanceof SearchLibraryError ||
        isQuotaExceededError(e) ||
        isCorruptedDBError(e)
    );
}
