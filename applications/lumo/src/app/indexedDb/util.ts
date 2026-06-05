import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

/**
 * Error thrown when IndexedDB is not available in the current environment.
 *
 * On iOS Safari this happens when storage access is blocked, e.g. when
 * "Block All Cookies" is enabled, in certain private-browsing/WebView contexts,
 * or under Lockdown Mode. In those cases the global `indexedDB` binding does not
 * exist at all, so referencing it directly throws a `ReferenceError`
 * ("Can't find variable: indexedDB").
 */
export class IndexedDBUnavailableError extends Error {
    constructor(message?: string) {
        super(
            message ??
                c('collider_2025:Error')
                    .t`${LUMO_SHORT_APP_NAME} needs local database storage (IndexedDB) to run, but it isn't available in this browser. This can happen when cookies or website data are blocked, in private browsing, or with Lockdown Mode enabled. Please allow website data for this site and reload.`
        );
        this.name = 'IndexedDBUnavailableError';
    }
}

/**
 * Safely returns the global IndexedDB factory.
 *
 * Accesses `indexedDB` via `globalThis` so that an absent global does not throw
 * a `ReferenceError`. Throws a typed {@link IndexedDBUnavailableError} instead,
 * which callers can surface to the user.
 */
export function getIndexedDB(): IDBFactory {
    const idb = typeof globalThis !== 'undefined' ? globalThis.indexedDB : undefined;
    if (!idb) {
        throw new IndexedDBUnavailableError();
    }
    return idb;
}

/**
 * Returns whether IndexedDB is available without throwing.
 */
export function isIndexedDBAvailable(): boolean {
    try {
        return Boolean(typeof globalThis !== 'undefined' && globalThis.indexedDB);
    } catch {
        return false;
    }
}

// Converts an IDBRequest into a Promise
export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Handles cursor iteration and collection of promises
export function withCursor(
    source: IDBIndex | IDBObjectStore,
    handleCursor: (cursor: IDBCursorWithValue) => Promise<void>
): Promise<void> {
    return new Promise((resolve, reject) => {
        const operationPromises: Promise<void>[] = [];

        const cursorRequest = source.openCursor();
        cursorRequest.onerror = () => reject(cursorRequest.error);

        cursorRequest.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
                operationPromises.push(handleCursor(cursor));
                cursor.continue();
            } else {
                Promise.all(operationPromises)
                    .then(() => resolve())
                    .catch(reject);
            }
        };
    });
}
