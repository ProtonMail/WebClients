import {
    AbortError as SdkAbortError,
    ConnectionError as SdkConnectionError,
    RateLimitedError as SdkRateLimitedError,
    ServerError as SdkServerError,
} from '@proton/drive';
import { sendErrorReport } from '@proton/drive/legacy/errorHandling';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';

import { setBridgedErrorDecision } from './bridgedErrorDecision';
import {
    InvalidIndexerState,
    MissingUserKeyEncryptionError,
    RepairableNodeError,
    SearchBlobCryptoError,
    SearchLibraryError,
    classifyError,
    isAbortError,
    isRepairableError,
    listenForWorkerErrors,
    maybeWrapAsRepairableNodeError,
    sendErrorReportForSearch,
    sendMessageReportForSearch,
} from './errors';

jest.mock('@proton/shared/lib/helpers/sentry', () => ({
    ...jest.requireActual('@proton/shared/lib/helpers/sentry'),
    captureMessage: jest.fn(),
}));

jest.mock('@proton/drive/legacy/errorHandling', () => ({
    ...jest.requireActual('@proton/drive/legacy/errorHandling'),
    sendErrorReport: jest.fn(),
}));

const mockedCaptureMessage = jest.mocked(captureMessage);
const mockedSendErrorReport = jest.mocked(sendErrorReport);

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

        it.each([
            ['Chrome/Edge', 'Failed to fetch'],
            ['Safari', 'Load failed'],
            ['Firefox', 'NetworkError when attempting to fetch resource.'],
        ])('native fetch failure (%s) is classified as "network"', (_browser, message) => {
            expect(classifyError(new TypeError(message))).toEqual({ kind: 'transient', reason: 'network' });
        });

        it('an unrelated TypeError is NOT treated as a "unknown"', () => {
            const e = new TypeError("Cannot read properties of undefined (reading 'foo')");
            expect(classifyError(e)).toEqual({ kind: 'transient', reason: 'unknown' });
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
    it('is true only for RepairableNodeError, regardless of the wrapped cause', () => {
        expect(isRepairableError(new RepairableNodeError('decryption failed', new Error('decryption failed')))).toBe(
            true
        );
    });

    it('is false for every other error shape, even ones classifyError buckets as unknown', () => {
        expect(isRepairableError(new DOMException('aborted', 'AbortError'))).toBe(false);
        expect(isRepairableError(new SearchLibraryError('wasm crash', null))).toBe(false);
        expect(isRepairableError(new SdkRateLimitedError('429'))).toBe(false);
        expect(isRepairableError(new Error('decryption failed'))).toBe(false);
        expect(isRepairableError('string')).toBe(false);
        expect(isRepairableError({ random: 'object' })).toBe(false);
    });
});

describe('maybeWrapAsRepairableNodeError', () => {
    it('leaves abort errors unwrapped', () => {
        expect(maybeWrapAsRepairableNodeError(new DOMException('aborted', 'AbortError'), 'msg')).not.toBeInstanceOf(
            RepairableNodeError
        );
        expect(maybeWrapAsRepairableNodeError(new SdkAbortError('aborted'), 'msg')).not.toBeInstanceOf(
            RepairableNodeError
        );
    });

    it('leaves permanent errors unwrapped - systemic, not this node', () => {
        expect(maybeWrapAsRepairableNodeError(new DOMException('', 'QuotaExceededError'), 'msg')).not.toBeInstanceOf(
            RepairableNodeError
        );
        expect(maybeWrapAsRepairableNodeError(new DOMException('', 'VersionError'), 'msg')).not.toBeInstanceOf(
            RepairableNodeError
        );
        expect(maybeWrapAsRepairableNodeError(new InvalidIndexerState('bad'), 'msg')).not.toBeInstanceOf(
            RepairableNodeError
        );
        expect(maybeWrapAsRepairableNodeError(new SearchLibraryError('wasm crash', null), 'msg')).not.toBeInstanceOf(
            RepairableNodeError
        );
        expect(
            maybeWrapAsRepairableNodeError(new SearchBlobCryptoError(new DOMException('', 'OperationError')), 'msg')
        ).not.toBeInstanceOf(RepairableNodeError);
        expect(maybeWrapAsRepairableNodeError(new MissingUserKeyEncryptionError(), 'msg')).not.toBeInstanceOf(
            RepairableNodeError
        );
    });

    it('leaves known transient network-family errors unwrapped - retry the whole batch, not the node', () => {
        expect(maybeWrapAsRepairableNodeError(new SdkRateLimitedError('429'), 'msg')).not.toBeInstanceOf(
            RepairableNodeError
        );
        expect(maybeWrapAsRepairableNodeError(new SdkServerError('5xx'), 'msg')).not.toBeInstanceOf(
            RepairableNodeError
        );
        expect(maybeWrapAsRepairableNodeError(new SdkConnectionError('connection'), 'msg')).not.toBeInstanceOf(
            RepairableNodeError
        );
    });

    it('wraps unknown deterministic errors as a RepairableNodeError carrying the original as cause', () => {
        const cause = new Error('decryption failed');
        const wrapped = maybeWrapAsRepairableNodeError(cause, 'failed to get node x');
        expect(wrapped).toBeInstanceOf(RepairableNodeError);
        expect((wrapped as RepairableNodeError).message).toBe('failed to get node x');
        expect((wrapped as RepairableNodeError).cause).toBe(cause);

        expect(maybeWrapAsRepairableNodeError('string', 'msg')).toBeInstanceOf(RepairableNodeError);
        expect(maybeWrapAsRepairableNodeError({ random: 'object' }, 'msg')).toBeInstanceOf(RepairableNodeError);
    });
});

describe('sendErrorReportForSearch never throws', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    // Callers are catch/finally blocks (WriteSession.commit, IndexRegistry.dispose,
    // IndexBlobStore.freeCached, CleanUpStaleBlobsTask). A throw here masks the original error or
    // skips cleanup, so the reporter has to absorb its own failures.
    it('swallows a failing reporting backend', () => {
        jest.spyOn(console, 'warn').mockImplementation(() => {
            throw new Error('reporting backend is down');
        });

        expect(() => sendErrorReportForSearch('msg', new Error('original'))).not.toThrow();
    });

    it('swallows a throw value that cannot be stringified', () => {
        const unstringifiable = Object.create(null) as unknown;

        expect(() => sendErrorReportForSearch('msg', unstringifiable)).not.toThrow();
    });

    it('swallows an error whose own property access throws', () => {
        const hostile = new Error('hostile');
        Object.defineProperty(hostile, 'name', {
            get() {
                throw new Error('exploding getter');
            },
        });

        expect(() => sendErrorReportForSearch('msg', hostile)).not.toThrow();
    });
});

describe('sendMessageReportForSearch', () => {
    beforeEach(() => {
        mockedCaptureMessage.mockClear();
    });

    it('calls captureMessage with an info level and the search component tag', () => {
        sendMessageReportForSearch('Search index capped (initial)', { extra: { documentCount: 50_000 } });

        expect(mockedCaptureMessage).toHaveBeenCalledWith(
            'Search index capped (initial)',
            expect.objectContaining({
                level: 'info',
                tags: expect.objectContaining({ component: 'search' }),
                extra: { documentCount: 50_000 },
            })
        );
    });

    it('lets the caller override the level', () => {
        sendMessageReportForSearch('msg', { level: 'warning' });

        expect(mockedCaptureMessage).toHaveBeenCalledWith('msg', expect.objectContaining({ level: 'warning' }));
    });

    it('never throws, even when the reporting backend fails', () => {
        mockedCaptureMessage.mockImplementationOnce(() => {
            throw new Error('reporting backend is down');
        });

        expect(() => sendMessageReportForSearch('msg')).not.toThrow();
    });
});

describe('listenForWorkerErrors', () => {
    // This test environment's BroadcastChannel does not actually deliver messages between
    // instances (verified: two channels of the same name never see each other's postMessage
    // here), so we can't drive this through a real second channel. Instead capture the
    // BroadcastChannel instance listenForWorkerErrors() creates and invoke its onmessage handler
    // directly with a synthetic event - exercising the exact routing logic under test, just
    // without the real transport.
    // This test environment's BroadcastChannel does not actually deliver messages between
    // separate instances (verified directly: two channels of the same name never see each
    // other's postMessage here). Instead, capture the real instance listenForWorkerErrors()
    // creates internally and invoke the onmessage handler it assigns directly with a synthetic
    // event - exercising the exact routing logic under test, just without the real transport.
    // mockImplementationOnce restores the constructor after one call, so it never wraps itself.
    let createdChannel: BroadcastChannel;

    beforeEach(() => {
        mockedCaptureMessage.mockClear();
        mockedSendErrorReport.mockClear();

        const RealBroadcastChannel = BroadcastChannel;
        jest.spyOn(global, 'BroadcastChannel').mockImplementationOnce((name: string) => {
            createdChannel = new RealBroadcastChannel(name);
            return createdChannel;
        });

        listenForWorkerErrors();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        createdChannel?.close();
    });

    const deliver = (data: unknown) => {
        if (!createdChannel?.onmessage) {
            throw new Error('listenForWorkerErrors did not register an onmessage handler');
        }
        createdChannel.onmessage({ data } as MessageEvent);
    };

    it('routes a kind: "message" payload to captureMessage', () => {
        deliver({ kind: 'message', message: 'index capped', context: { level: 'info' } });

        expect(mockedCaptureMessage).toHaveBeenCalledWith('index capped', { level: 'info' });
        expect(mockedSendErrorReport).not.toHaveBeenCalled();
    });

    it('routes a kind: "error" payload to sendErrorReport', () => {
        const error = new Error('boom');
        deliver({ kind: 'error', error, context: { level: 'error' } });

        expect(mockedSendErrorReport).toHaveBeenCalledWith(error, { level: 'error' });
        expect(mockedCaptureMessage).not.toHaveBeenCalled();
    });

    it('treats a legacy payload with no `kind` (previous-bundle worker during a deploy overlap) as an error, not a lost message', () => {
        const error = new Error('boom from an old worker bundle');
        // Pre-`kind` shape: exactly what sendErrorReportForSearch posted before this change.
        deliver({ error, context: { level: 'error' } });

        expect(mockedSendErrorReport).toHaveBeenCalledWith(error, { level: 'error' });
        expect(mockedCaptureMessage).not.toHaveBeenCalled();
    });
});
