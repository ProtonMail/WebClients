import { AbortError as SdkAbortError } from '@proton/drive';
import { Document, Engine, Value } from '@proton/proton-foundation-search';

import { InvalidIndexerState, SearchLibraryError, classifyError, isRepairableError } from '../../shared/errors';
import { setupRealSearchLibraryWasm } from '../../testing/setupRealSearchLibraryWasm';
import { engineCall, engineCallAsync, engineStream, isWasmPanic, maybeWrapAsSearchLibraryError } from './engineCall';

/** Shape of a raw wasm-bindgen throw: a plain Error with nothing to classify on. */
const rustError = (message: string) => new Error(message);

describe('maybeWrapAsSearchLibraryError', () => {
    describe('wraps raw WASM errors', () => {
        it.each([
            'null pointer passed to rust',
            'attempted to take ownership of Rust value while it was borrowed',
            'unreachable',
        ])('%s -> SearchLibraryError', (message) => {
            const cause = rustError(message);
            const wrapped = maybeWrapAsSearchLibraryError('query', cause);

            expect(wrapped).toBeInstanceOf(SearchLibraryError);
            expect(wrapped).toHaveProperty('cause', cause);
        });

        it('classifies as permanent, not as a repairable node failure', () => {
            const wrapped = maybeWrapAsSearchLibraryError('query', rustError('null pointer passed to rust'));

            expect(classifyError(wrapped)).toEqual({ kind: 'permanent', reason: 'search_library_error' });
            // isRepairableError is a positive instanceof check (RepairableNodeError), constructed only
            // at genuinely node-scoped call sites - neither the wrapped nor the raw WASM error is ever
            // repairable, regardless of whether this engine boundary classifies it first.
            expect(isRepairableError(wrapped)).toBe(false);
            expect(isRepairableError(rustError('null pointer passed to rust'))).toBe(false);
        });

        it('wraps a WebAssembly.RuntimeError', () => {
            expect(maybeWrapAsSearchLibraryError('commit', new WebAssembly.RuntimeError('unreachable'))).toBeInstanceOf(
                SearchLibraryError
            );
        });

        it('wraps non-Error throws', () => {
            expect(maybeWrapAsSearchLibraryError('commit', 'boom')).toBeInstanceOf(SearchLibraryError);
        });

        it('leaves the message alone when no panic was captured', () => {
            // A panic with no hook output (and any non-panic error) keeps the plain message: the
            // panic suffix is only ever added from a real capture.
            expect(maybeWrapAsSearchLibraryError('commit', new WebAssembly.RuntimeError('unreachable'))).toHaveProperty(
                'message',
                'Search library WASM failed: commit'
            );
            expect(maybeWrapAsSearchLibraryError('insert', rustError('boom'))).toHaveProperty(
                'message',
                'Search library WASM failed: insert'
            );
        });
    });

    describe('passes through errors that already carry a meaning', () => {
        it('quota exceeded (raised by IndexedDB inside a blob save)', () => {
            const e = new DOMException('', 'QuotaExceededError');
            expect(maybeWrapAsSearchLibraryError('save blob', e)).toBe(e);
            expect(classifyError(maybeWrapAsSearchLibraryError('save blob', e))).toEqual({
                kind: 'permanent',
                reason: 'quota_exceeded',
            });
        });

        it('corrupted DB (raised by IndexedDB inside a blob load)', () => {
            const e = new DOMException('', 'VersionError');
            expect(maybeWrapAsSearchLibraryError('load blob', e)).toBe(e);
        });

        it('abort', () => {
            const domAbort = new DOMException('aborted', 'AbortError');
            expect(maybeWrapAsSearchLibraryError('query', domAbort)).toBe(domAbort);

            const sdkAbort = new SdkAbortError('aborted');
            expect(maybeWrapAsSearchLibraryError('query', sdkAbort)).toBe(sdkAbort);
        });

        it('InvalidIndexerState', () => {
            const e = new InvalidIndexerState('session already released');
            expect(maybeWrapAsSearchLibraryError('insert', e)).toBe(e);
        });

        it('an already-wrapped SearchLibraryError is not wrapped twice', () => {
            const e = new SearchLibraryError('Search library WASM failed: insert', rustError('boom'));
            expect(maybeWrapAsSearchLibraryError('commit', e)).toBe(e);
        });
    });
});

describe('isWasmPanic', () => {
    it('recognises a Rust panic', () => {
        expect(isWasmPanic(new WebAssembly.RuntimeError('unreachable'))).toBe(true);
    });

    it('sees through our own wrapper', () => {
        const wrapped = maybeWrapAsSearchLibraryError('commit', new WebAssembly.RuntimeError('unreachable'));
        expect(isWasmPanic(wrapped)).toBe(true);
    });

    it('rejects errors that did not abort the WASM', () => {
        // A wasm-bindgen error returned through a Result is a plain Error, not a panic: nothing is
        // poisoned and no panic text exists for it.
        expect(isWasmPanic(rustError('null pointer passed to rust'))).toBe(false);
        expect(isWasmPanic(new SearchLibraryError('Search library WASM failed: insert', rustError('boom')))).toBe(
            false
        );
        expect(isWasmPanic(new DOMException('aborted', 'AbortError'))).toBe(false);
        expect(isWasmPanic(undefined)).toBe(false);
    });
});

describe('a real Rust panic', () => {
    // The only deterministic WASM panic reachable from JS: the library panics when `next()` is called
    // again with a `Load` event still unserved.
    setupRealSearchLibraryWasm();

    it('reaches the error message with its Rust location', () => {
        const engine = Engine.builder().build();
        const write = engine.write();
        if (!write) {
            expect(write).toBeDefined();
            return;
        }
        const doc = new Document('doc-1');
        doc.addAttribute('name', Value.text('hello world'));
        write.insert(doc);
        const execution = write.commit();
        execution.next();

        let panic: unknown;
        try {
            execution.next();
        } catch (e) {
            panic = e;
        }

        expect(maybeWrapAsSearchLibraryError('commit: next event', panic)).toHaveProperty(
            'message',
            expect.stringMatching(
                /^Search library WASM failed: commit: next event \(rust panic: panicked at .+load event was not handled.+\)$/
            )
        );
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
