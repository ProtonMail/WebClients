import {
    AbortError as SdkAbortError,
    ConnectionError as SdkConnectionError,
    RateLimitedError as SdkRateLimitedError,
    ServerError as SdkServerError,
} from '@proton/drive';

import { InvalidIndexerState, SearchLibraryError, classifyError } from './errors';

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
