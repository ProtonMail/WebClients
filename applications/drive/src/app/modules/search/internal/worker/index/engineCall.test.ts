import { AbortError as SdkAbortError } from '@proton/drive';

import { InvalidIndexerState, SearchLibraryError, classifyError, isRepairableError } from '../../shared/errors';
import { engineCall, engineCallAsync, engineStream, toEngineError } from './engineCall';

/** Shape of a raw wasm-bindgen throw: a plain Error with nothing to classify on. */
const rustError = (message: string) => new Error(message);

describe('toEngineError', () => {
    describe('wraps raw WASM errors', () => {
        it.each([
            'null pointer passed to rust',
            'attempted to take ownership of Rust value while it was borrowed',
            'unreachable',
        ])('%s -> SearchLibraryError', (message) => {
            const cause = rustError(message);
            const wrapped = toEngineError('query', cause);

            expect(wrapped).toBeInstanceOf(SearchLibraryError);
            expect(wrapped).toHaveProperty('cause', cause);
        });

        it('classifies as permanent, not as a repairable node failure', () => {
            const wrapped = toEngineError('query', rustError('null pointer passed to rust'));

            expect(classifyError(wrapped)).toEqual({ kind: 'permanent', reason: 'search_library_error' });
            // The regression this whole wrapper exists for: unwrapped, these were quarantined into
            // the repair table and replayed forever.
            expect(isRepairableError(wrapped)).toBe(false);
            expect(isRepairableError(rustError('null pointer passed to rust'))).toBe(true);
        });

        it('wraps a WebAssembly.RuntimeError', () => {
            expect(toEngineError('commit', new WebAssembly.RuntimeError('unreachable'))).toBeInstanceOf(
                SearchLibraryError
            );
        });

        it('wraps non-Error throws', () => {
            expect(toEngineError('commit', 'boom')).toBeInstanceOf(SearchLibraryError);
        });
    });

    describe('passes through errors that already carry a meaning', () => {
        it('quota exceeded (raised by IndexedDB inside a blob save)', () => {
            const e = new DOMException('', 'QuotaExceededError');
            expect(toEngineError('save blob', e)).toBe(e);
            expect(classifyError(toEngineError('save blob', e))).toEqual({
                kind: 'permanent',
                reason: 'quota_exceeded',
            });
        });

        it('corrupted DB (raised by IndexedDB inside a blob load)', () => {
            const e = new DOMException('', 'VersionError');
            expect(toEngineError('load blob', e)).toBe(e);
        });

        it('abort', () => {
            const domAbort = new DOMException('aborted', 'AbortError');
            expect(toEngineError('query', domAbort)).toBe(domAbort);

            const sdkAbort = new SdkAbortError('aborted');
            expect(toEngineError('query', sdkAbort)).toBe(sdkAbort);
        });

        it('InvalidIndexerState', () => {
            const e = new InvalidIndexerState('session already released');
            expect(toEngineError('insert', e)).toBe(e);
        });

        it('an already-wrapped SearchLibraryError is not wrapped twice', () => {
            const e = new SearchLibraryError('Search library WASM failed: insert', rustError('boom'));
            expect(toEngineError('commit', e)).toBe(e);
        });
    });
});

describe('engineCall', () => {
    it('returns the value on success', () => {
        expect(engineCall('op', () => 42)).toBe(42);
    });

    it('wraps a throw', () => {
        expect(() =>
            engineCall('op', () => {
                throw rustError('unreachable');
            })
        ).toThrow(SearchLibraryError);
    });
});

describe('engineCallAsync', () => {
    it('returns the value on success', async () => {
        await expect(engineCallAsync('op', async () => 42)).resolves.toBe(42);
    });

    it('wraps a rejection', async () => {
        await expect(
            engineCallAsync('op', async () => {
                throw rustError('unreachable');
            })
        ).rejects.toBeInstanceOf(SearchLibraryError);
    });
});

describe('engineStream', () => {
    it('yields every value on success', async () => {
        const collected: number[] = [];
        for await (const v of engineStream('op', async function* () {
            yield 1;
            yield 2;
        })) {
            collected.push(v);
        }
        expect(collected).toEqual([1, 2]);
    });

    it('wraps a throw raised while building the iterator', async () => {
        const stream = engineStream('query', () => {
            throw rustError('null pointer passed to rust');
        });
        await expect(stream.next()).rejects.toBeInstanceOf(SearchLibraryError);
    });

    it('wraps a throw raised mid-iteration', async () => {
        const stream = engineStream('query', async function* () {
            yield 1;
            throw rustError('attempted to take ownership of Rust value while it was borrowed');
        });

        await expect(stream.next()).resolves.toEqual({ value: 1, done: false });
        await expect(stream.next()).rejects.toBeInstanceOf(SearchLibraryError);
    });

    it('wraps a throw raised by cleanup when the consumer breaks out early', async () => {
        // Mirrors IndexReader: `search.free()` in a finally, reached via the consumer's `break`.
        const stream = engineStream('query', async function* () {
            try {
                yield 1;
                yield 2;
            } finally {
                throw rustError('null pointer passed to rust');
            }
        });

        await expect(
            (async () => {
                for await (const value of stream) {
                    expect(value).toBe(1);
                    break;
                }
            })()
        ).rejects.toBeInstanceOf(SearchLibraryError);
    });

    it('lets an abort through untouched', async () => {
        const abort = new DOMException('aborted', 'AbortError');
        const stream = engineStream('query', async function* () {
            yield 1;
            throw abort;
        });

        await stream.next();
        await expect(stream.next()).rejects.toBe(abort);
    });
});
