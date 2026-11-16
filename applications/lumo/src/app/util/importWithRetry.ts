import { wait } from '@proton/shared/lib/helpers/promise';

/**
 * Whether an error comes from a chunk that failed to download, which a new attempt can fix.
 *
 * In a worker, `importScripts` throws a `NetworkError` DOMException when the script fails to load.
 * In a window, webpack rejects with a `ChunkLoadError`. Any other error (a syntax error, a module that
 * throws while it starts) happens again on every attempt, so it is not retried.
 */
export function isChunkLoadError(error: unknown): boolean {
    if (!error || typeof error !== 'object' || !('name' in error)) {
        return false;
    }
    return error.name === 'NetworkError' || error.name === 'ChunkLoadError';
}

/**
 * Runs a dynamic import, trying again if its chunk fails to load.
 *
 * Use it for dynamic imports in workers. There webpack loads chunks with `importScripts`, which throws
 * synchronously, so the shared RetryChunkLoadPlugin never sees the failure and never retries. A chunk
 * that failed is not marked as loaded, so calling the import again fetches it again.
 */
export async function importWithRetry<T>(
    load: () => Promise<T>,
    { retries = 3, delayMs = 1000 }: { retries?: number; delayMs?: number } = {}
): Promise<T> {
    for (let attempt = 0; ; attempt++) {
        try {
            return await load();
        } catch (error) {
            if (attempt >= retries || !isChunkLoadError(error)) {
                throw error;
            }
            await wait(delayMs);
        }
    }
}
