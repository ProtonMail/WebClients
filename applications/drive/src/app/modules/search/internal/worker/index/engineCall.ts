import { SearchLibraryError, classifyError, isAbortError } from '../../shared/errors';
import { takeLastWasmPanic } from './wasmPanic';

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

/**
 * Whether the error comes from a Rust panic, which aborts rather than unwinds and so surfaces as a
 * `WebAssembly.RuntimeError` carrying no message of its own. The real message is only available from
 * the panic hook, see `wasmPanic.ts`.
 *
 * A handful of non-panic WASM aborts (out-of-bounds access, indirect call mismatch) look the same
 * from JS and match too; for them no panic text exists and the message stays as it is.
 */
export function isWasmPanic(e: unknown): boolean {
    if (e instanceof WebAssembly.RuntimeError) {
        return true;
    }
    // Our own wrapper is transparent here, so callers can ask the question about a caught error
    // whether or not it has already crossed an engine boundary.
    return e instanceof SearchLibraryError && isWasmPanic(e.cause);
}

export function maybeWrapAsSearchLibraryError(operation: string, e: unknown): unknown {
    if (isPassThrough(e)) {
        return e;
    }

    const panic = isWasmPanic(e) ? takeLastWasmPanic() : undefined;
    const rustPanic = panic ? ` (rust panic: ${panic})` : '';
    return new SearchLibraryError(`Search library WASM failed: ${operation}${rustPanic}`, e);
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
