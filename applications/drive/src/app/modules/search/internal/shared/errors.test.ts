import {
    AbortError as SdkAbortError,
    ConnectionError as SdkConnectionError,
    RateLimitedError as SdkRateLimitedError,
    ServerError as SdkServerError,
} from '@proton/drive';

import { setBridgedErrorDecision } from './bridgedErrorDecision';
import {
    InvalidIndexerState,
    MissingUserKeyEncryptionError,
    SearchBlobCryptoError,
    SearchLibraryError,
    classifyError,
    isAbortError,
    isRepairableError,
} from './errors';

describe('classifyError', () => {
    describe('permanent beats transient', () => {
        it('QuotaExceededError → permanent quota_exceeded', () => {
            const e = new DOMException('', 'QuotaExceededError');
            expect(classifyError(e)).toEqual({ kind: 'permanent', reason: 'quota_exceeded' });
        });

        it('VersionError → permanent corrupted_db', () => {
            const e = new DOMException('', 'VersionError');
            expect(classifyError(e)).toEqual({ kind: 'permanent', reason: 'corrupted_db' });
        });

        it('InvalidStateError → permanent corrupted_db', () => {
            const e = new DOMException('', 'InvalidStateError');
            expect(classifyError(e)).toEqual({ kind: 'permanent', reason: 'corrupted_db' });
        });

        it('InvalidIndexerState → permanent invalid_indexer_state', () => {
            expect(classifyError(new InvalidIndexerState('bad state'))).toEqual({
                kind: 'permanent',
                reason: 'invalid_indexer_state',
            });
        });

        it('SearchLibraryError → permanent search_library_error', () => {
            expect(classifyError(new SearchLibraryError('wasm crash', null))).toEqual({
                kind: 'permanent',
                reason: 'search_library_error',
            });
        });

        it('SearchBlobCryptoError → permanent search_crypto_error', () => {
            expect(classifyError(new SearchBlobCryptoError(new DOMException('', 'OperationError')))).toEqual({
                kind: 'permanent',
                reason: 'search_crypto_error',
            });
        });

        it('MissingUserKeyEncryptionError → permanent search_crypto_error', () => {
            expect(classifyError(new MissingUserKeyEncryptionError())).toEqual({
                kind: 'permanent',
                reason: 'search_crypto_error',
            });
        });
    });

    describe('SDK error priority order', () => {
        it('RateLimitedError → rate-limited (subclass of ServerError, must be checked first)', () => {
            const e = new SdkRateLimitedError('429');
            // Sanity check: regression guard for the priority assertion below.
            expect(e).toBeInstanceOf(SdkServerError);

            expect(classifyError(e)).toEqual({ kind: 'transient', reason: 'rate-limited' });
        });

        it('plain ServerError → server', () => {
            expect(classifyError(new SdkServerError('5xx'))).toEqual({
                kind: 'transient',
                reason: 'server',
            });
        });

        it('ConnectionError → offline', () => {
            expect(classifyError(new SdkConnectionError('connection'))).toEqual({
                kind: 'transient',
                reason: 'offline',
            });
        });
    });

    describe('across the Comlink boundary', () => {
        // End-to-end coverage of the decision transport lives in comlinkErrorTransferHandler.test.ts,
        // driving the real handler. Reproducing its steps here would only assert that a value put
        // into the WeakMap comes back out. What is worth pinning here is the premise: that a cloned
        // error really is unclassifiable, which is the whole reason the transport exists.
        it('structured clone destroys everything classifyError would otherwise match on', () => {
            const cloned: unknown = structuredClone(new SdkServerError('5xx'));

            expect(cloned).not.toBeInstanceOf(SdkServerError);
            expect(cloned).toHaveProperty('name', 'Error');
            expect(classifyError(cloned)).toEqual({ kind: 'transient', reason: 'unknown' });
        });
    });

    describe('abort detection (beats other transients)', () => {
        it('DOMException with name AbortError → transient abort', () => {
            const e = new DOMException('aborted', 'AbortError');
            expect(classifyError(e)).toEqual({ kind: 'transient', reason: 'abort' });
        });

        it('SdkAbortError → transient abort', () => {
            expect(classifyError(new SdkAbortError('aborted'))).toEqual({
                kind: 'transient',
                reason: 'abort',
            });
        });

        it('a bare Error named AbortError is NOT an abort: no such shape reaches us', () => {
            // The SDK's AbortError is a real subclass, and a crossed one arrives named "Error", so
            // this shape only ever existed in tests. isAbortError relies on the bridged decision.
            const e = Object.assign(new Error('Request aborted'), { name: 'AbortError' });
            expect(classifyError(e)).toEqual({ kind: 'transient', reason: 'unknown' });
        });

        it('an SdkAbortError that crossed the boundary is still recognised by isAbortError', () => {
            const decision = classifyError(new SdkAbortError('aborted'));
            const received: unknown = structuredClone(new SdkAbortError('aborted'));
            expect(isAbortError(received)).toBe(false);

            setBridgedErrorDecision(received, decision);
            expect(isAbortError(received)).toBe(true);
        });
    });

    describe('legacy fetch-shape errors', () => {
        it('OfflineError (name match) → offline', () => {
            const e = Object.assign(new Error('offline'), { name: 'OfflineError' });
            expect(classifyError(e)).toEqual({ kind: 'transient', reason: 'offline' });
        });

        it('503 → server', () => {
            const e = Object.assign(new Error('5xx'), { status: 503 });
            expect(classifyError(e)).toEqual({ kind: 'transient', reason: 'server' });
        });

        it('NetworkError (name match) → network', () => {
            const e = Object.assign(new Error('netfail'), { name: 'NetworkError' });
            expect(classifyError(e)).toEqual({ kind: 'transient', reason: 'network' });
        });

        it('TimeoutError (name match) → network', () => {
            const e = Object.assign(new Error('timeout'), { name: 'TimeoutError' });
            expect(classifyError(e)).toEqual({ kind: 'transient', reason: 'network' });
        });
    });

    describe('unknown fallback', () => {
        it('plain Error → unknown', () => {
            expect(classifyError(new Error('mystery'))).toEqual({
                kind: 'transient',
                reason: 'unknown',
            });
        });

        it('non-Error value → unknown', () => {
            expect(classifyError('string')).toEqual({ kind: 'transient', reason: 'unknown' });
            expect(classifyError(42)).toEqual({ kind: 'transient', reason: 'unknown' });
            expect(classifyError({ random: 'object' })).toEqual({ kind: 'transient', reason: 'unknown' });
        });
    });
});

describe('isRepairableError', () => {
    it('treats abort as not repairable', () => {
        expect(isRepairableError(new DOMException('aborted', 'AbortError'))).toBe(false);
        expect(isRepairableError(new SdkAbortError('aborted'))).toBe(false);
    });

    it('treats permanent errors as not repairable', () => {
        expect(isRepairableError(new DOMException('', 'QuotaExceededError'))).toBe(false);
        expect(isRepairableError(new DOMException('', 'VersionError'))).toBe(false);
        expect(isRepairableError(new InvalidIndexerState('bad'))).toBe(false);
        expect(isRepairableError(new SearchLibraryError('wasm crash', null))).toBe(false);
        expect(isRepairableError(new SearchBlobCryptoError(new DOMException('', 'OperationError')))).toBe(false);
        expect(isRepairableError(new MissingUserKeyEncryptionError())).toBe(false);
    });

    it('treats known transient network-family errors as not repairable', () => {
        expect(isRepairableError(new SdkRateLimitedError('429'))).toBe(false);
        expect(isRepairableError(new SdkServerError('5xx'))).toBe(false);
        expect(isRepairableError(new SdkConnectionError('connection'))).toBe(false);
    });

    it('treats unknown deterministic errors as node-scoped (repairable)', () => {
        expect(isRepairableError(new Error('decryption failed'))).toBe(true);
        expect(isRepairableError('string')).toBe(true);
        expect(isRepairableError({ random: 'object' })).toBe(true);
    });
});
