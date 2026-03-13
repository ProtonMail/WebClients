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
export class InvalidSearcherState extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidSearcherState';
    }
}
export class InvalidSearcherConfig extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidSearcherConfig';
    }
}

export class InvalidOrchestratorState extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidOrchestratorState';
    }
}

/**
 * Thrown when the search library WASM raises an error.
 */
export class SearchLibraryError extends Error {
    constructor(
        message: string,
        readonly cause?: unknown
    ) {
        super(message);
        this.name = 'SearchLibraryError';
    }
}

/**
 * Returns true for errors that are unrecoverable and should permanently stop the
 * indexing state machine. These errors won't fix themselves and will require actions such as: page reload,
 * user intervention (to free some hard drive space), clearing a corrupted DB, etc.
 */
export function isPermanentError(e: unknown): boolean {
    // TODO: Add blob decryption/encryption error here when we start encrypting/decrypting.
    // TODO: Add specific corrupted/missing DB exceptions
    return e instanceof InvalidIndexerState || e instanceof SearchLibraryError || isQuotaExceededError(e);
}
