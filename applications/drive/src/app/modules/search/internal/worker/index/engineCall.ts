import { SearchLibraryError, classifyError, isAbortError } from '../../shared/errors';

/**
 * Errors that must keep their identity when they pass through an engine call.
 *
 * Blob load/save run *inside* the engine's commit, query and cleanup event loops, so IndexedDB
 * and crypto failures surface from what looks like a WASM call. Re-labelling those as
 * `search_library_error` would lose the quota notification and the corrupted-DB reset path.
 *
 * `classifyError(e).kind === 'permanent'` also covers `SearchLibraryError` and
 * `InvalidIndexerState`, so an already-wrapped error is never wrapped twice.
 */
function isPassThrough(e: unknown): boolean {
    return isAbortError(e) || classifyError(e).kind === 'permanent';
}

export function maybeWrapAsSearchLibraryError(operation: string, e: unknown): unknown {
    return isPassThrough(e) ? e : new SearchLibraryError(`Search library WASM failed: ${operation}`, e);
}

/** Wrap a synchronous engine call. */
export function engineCall<T>(operation: string, fn: () => T): T {
    try {
        return fn();
    } catch (e) {
        throw maybeWrapAsSearchLibraryError(operation, e);
    }
}

/** Wrap an async engine call. */
export async function engineCallAsync<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    try {
        return await fn();
    } catch (e) {
        throw maybeWrapAsSearchLibraryError(operation, e);
    }
}

/**
 * Wrap an async generator over engine results. Covers the iterator's whole lifetime, including the
 * `finally` cleanup (`search.free()`, `entry.free()`) that runs when a consumer breaks out early -
 * which is where "null pointer passed to rust" comes from.
 */
export async function* engineStream<T>(operation: string, makeIterator: () => AsyncGenerator<T>): AsyncGenerator<T> {
    let iterator: AsyncGenerator<T>;
    try {
        iterator = makeIterator();
    } catch (e) {
        throw maybeWrapAsSearchLibraryError(operation, e);
    }
    try {
        for await (const value of iterator) {
            yield value;
        }
    } catch (e) {
        throw maybeWrapAsSearchLibraryError(operation, e);
    }
}
