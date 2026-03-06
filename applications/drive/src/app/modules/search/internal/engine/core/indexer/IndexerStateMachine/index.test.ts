import { IndexerStateMachine } from '.';
import { Logger } from '../../../../Logger';
import { InvalidIndexerState, SearchLibraryError } from '../../../../errors';
import { runBulkUpdate } from './states/runBulkUpdate';
import { runCleanup } from './states/runCleanup';
import { runIncrementalUpdate } from './states/runIncrementalUpdate';
import { InitOutcome, runInit } from './states/runInit';
import { runScheduleIncrementalUpdate } from './states/runScheduleIncrementalUpdate';
import { runTransientFailure } from './states/runTransientFailure';
import type { IndexerStateMachineParams } from './types';

jest.mock('../../../../Logger', () => ({
    Logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../../../configs', () => ({
    getEngineConfig: jest.fn().mockReturnValue({ configName: 'v1', BulkUpdater: class {} }),
}));

jest.mock('./states/runInit');
jest.mock('./states/runBulkUpdate');
jest.mock('./states/runCleanup');
jest.mock('./states/runIncrementalUpdate');
jest.mock('./states/runScheduleIncrementalUpdate');
jest.mock('./states/runTransientFailure');

const mockRunInit = jest.mocked(runInit);
const mockRunBulkUpdate = jest.mocked(runBulkUpdate);
const mockRunCleanup = jest.mocked(runCleanup);
const mockRunIncrementalUpdate = jest.mocked(runIncrementalUpdate);
const mockRunScheduleIncrementalUpdate = jest.mocked(runScheduleIncrementalUpdate);
const mockRunTransientFailure = jest.mocked(runTransientFailure);

/** Rejects with an AbortError to terminate the run loop cleanly. */
const stopStateMachineViaAbort = () => Promise.reject(new DOMException('Aborted', 'AbortError'));

/** Flushes pending microtasks and one I/O tick so async mock chains settle. */
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

function makeParams() {
    // Capture the listener installed by the constructor so tests can trigger it.
    let capturedListener: () => void = () => {
        throw new Error('onChange listener not yet registered');
    };

    const bridgeService = {
        onChange: jest.fn().mockImplementation((listener: () => void) => {
            capturedListener = listener;
            return () => {};
        }),
        get: jest.fn().mockReturnValue({}), // non-null bridge by default
    };

    const params: IndexerStateMachineParams = {
        requiredConfigKey: 'v1',
        db: {} as any,
        bridgeService: bridgeService as any,
        indexWriter: {} as any,
    };

    return {
        params,
        bridgeService,
        triggerBridgeServiceOnChangeListener: () => capturedListener(),
    };
}

beforeEach(() => {
    jest.clearAllMocks();

    // Safe defaults: every handler resolves immediately.
    // Individual tests override these as needed.
    mockRunInit.mockResolvedValue({ outcome: InitOutcome.UP_TO_DATE });
    mockRunBulkUpdate.mockResolvedValue(undefined);
    mockRunCleanup.mockResolvedValue(undefined);
    mockRunIncrementalUpdate.mockResolvedValue(undefined);
    mockRunScheduleIncrementalUpdate.mockResolvedValue(undefined);
    mockRunTransientFailure.mockResolvedValue(undefined);
});

describe('start()', () => {
    it('starts in the IDLE state before start() is called', () => {
        const { params } = makeParams();
        const sm = new IndexerStateMachine(params);
        expect(sm.getState()).toBe('IDLE');
    });

    it('returns early with a warning if already running', async () => {
        const { params } = makeParams();
        const sm = new IndexerStateMachine(params);

        // Block the loop indefinitely on the first CLEANUP call.
        let unblock: () => void = () => {};
        mockRunInit.mockResolvedValueOnce({ outcome: InitOutcome.UP_TO_DATE });
        mockRunCleanup.mockReturnValueOnce(new Promise((resolve) => (unblock = resolve)));

        // Kick off the state machine without awaiting it.
        const firstRun = sm.start();

        await flush(); // let the loop reach CLEANUP

        // Second start should warn and return immediately.
        await sm.start();

        expect(jest.mocked(Logger.warn)).toHaveBeenCalledWith(expect.stringContaining('cannot start'));

        // Clean up: unblock CLEANUP then stop.
        unblock();
        sm.stop();
        await firstRun;
    });

    it('can be restarted after stop()', async () => {
        const { params } = makeParams();
        const sm = new IndexerStateMachine(params);

        mockRunInit.mockResolvedValueOnce({ outcome: InitOutcome.UP_TO_DATE });
        mockRunCleanup.mockImplementationOnce(() => stopStateMachineViaAbort());

        const startPromise = sm.start();
        await flush();
        sm.stop();
        await startPromise;

        expect(sm.getState()).toBe('IDLE');

        // Second start should run normally.
        mockRunInit.mockResolvedValueOnce({ outcome: InitOutcome.UP_TO_DATE });
        mockRunCleanup.mockImplementationOnce(() => stopStateMachineViaAbort());

        await sm.start();

        expect(mockRunInit).toHaveBeenCalledTimes(2);
    });

    it('warns and does nothing when called after a permanent STOP', async () => {
        const { params } = makeParams();
        const sm = new IndexerStateMachine(params);

        mockRunInit.mockResolvedValueOnce({ outcome: InitOutcome.UP_TO_DATE });
        mockRunCleanup.mockResolvedValueOnce(undefined);
        mockRunIncrementalUpdate.mockRejectedValueOnce(new InvalidIndexerState('bad state'));

        await sm.start();
        expect(sm.getState()).toBe('STOP');

        await sm.start();

        expect(jest.mocked(Logger.warn)).toHaveBeenCalledWith(expect.stringContaining('cannot start'));
        // No additional state handler calls after the permanent stop.
        expect(mockRunInit).toHaveBeenCalledTimes(1);
    });
});

describe('stop()', () => {
    it('aborts the in-progress run and resolves start()', async () => {
        const { params } = makeParams();
        const sm = new IndexerStateMachine(params);

        // Reach SCHEDULE_INCREMENTAL_UPDATE, which receives the signal and can honour abort.
        mockRunInit.mockResolvedValueOnce({ outcome: InitOutcome.UP_TO_DATE });
        mockRunCleanup.mockResolvedValueOnce(undefined);
        mockRunIncrementalUpdate.mockResolvedValueOnce(undefined);
        mockRunScheduleIncrementalUpdate.mockImplementationOnce(
            (_ctx, signal) =>
                new Promise<void>((_, reject) =>
                    signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
                )
        );

        const startPromise = sm.start();
        await flush();

        sm.stop();

        await startPromise; // resolves once the abort propagates through the handler
        expect(sm.getState()).toBe('IDLE');
    });
});

describe('state transitions', () => {
    it('INIT → BULK_UPDATE when runInit returns needs_bulk_update', async () => {
        const { params } = makeParams();
        const sm = new IndexerStateMachine(params);

        mockRunInit.mockResolvedValueOnce({ outcome: InitOutcome.NEEDS_BULK_UPDATE });
        mockRunBulkUpdate.mockImplementationOnce(() => stopStateMachineViaAbort());

        await sm.start();

        expect(mockRunBulkUpdate).toHaveBeenCalledTimes(1);
    });

    it('INIT → CLEANUP when runInit returns up_to_date', async () => {
        const { params } = makeParams();
        const sm = new IndexerStateMachine(params);

        mockRunInit.mockResolvedValueOnce({ outcome: InitOutcome.UP_TO_DATE });
        mockRunCleanup.mockImplementationOnce(() => stopStateMachineViaAbort());

        await sm.start();

        expect(mockRunCleanup).toHaveBeenCalledTimes(1);
        expect(mockRunBulkUpdate).not.toHaveBeenCalled();
    });

    it('BULK_UPDATE → INCREMENTAL_UPDATE on success', async () => {
        const { params } = makeParams();
        const sm = new IndexerStateMachine(params);

        mockRunInit.mockResolvedValueOnce({ outcome: InitOutcome.NEEDS_BULK_UPDATE });
        mockRunBulkUpdate.mockResolvedValueOnce(undefined);
        mockRunIncrementalUpdate.mockImplementationOnce(() => stopStateMachineViaAbort());

        await sm.start();

        expect(mockRunIncrementalUpdate).toHaveBeenCalledTimes(1);
    });

    it('CLEANUP → INCREMENTAL_UPDATE on success', async () => {
        const { params } = makeParams();
        const sm = new IndexerStateMachine(params);

        mockRunInit.mockResolvedValueOnce({ outcome: InitOutcome.UP_TO_DATE });
        mockRunCleanup.mockResolvedValueOnce(undefined);
        mockRunIncrementalUpdate.mockImplementationOnce(() => stopStateMachineViaAbort());

        await sm.start();

        expect(mockRunIncrementalUpdate).toHaveBeenCalledTimes(1);
    });

    it('INCREMENTAL_UPDATE → SCHEDULE_INCREMENTAL_UPDATE on success', async () => {
        const { params } = makeParams();
        const sm = new IndexerStateMachine(params);

        mockRunInit.mockResolvedValueOnce({ outcome: InitOutcome.UP_TO_DATE });
        mockRunCleanup.mockResolvedValueOnce(undefined);
        mockRunIncrementalUpdate.mockResolvedValueOnce(undefined);
        mockRunScheduleIncrementalUpdate.mockImplementationOnce(() => stopStateMachineViaAbort());

        await sm.start();

        expect(mockRunScheduleIncrementalUpdate).toHaveBeenCalledTimes(1);
    });

    it('SCHEDULE_INCREMENTAL_UPDATE → INCREMENTAL_UPDATE on success', async () => {
        const { params } = makeParams();
        const sm = new IndexerStateMachine(params);

        mockRunInit.mockResolvedValueOnce({ outcome: InitOutcome.UP_TO_DATE });
        mockRunCleanup.mockResolvedValueOnce(undefined);
        mockRunIncrementalUpdate.mockResolvedValueOnce(undefined);
        mockRunScheduleIncrementalUpdate.mockResolvedValueOnce(undefined);
        // Second call to INCREMENTAL_UPDATE confirms the loop cycled back.
        mockRunIncrementalUpdate.mockImplementationOnce(() => stopStateMachineViaAbort());

        await sm.start();

        expect(mockRunIncrementalUpdate).toHaveBeenCalledTimes(2);
    });

    it('TRANSIENT_FAILURE → INIT on success', async () => {
        const { params } = makeParams();
        const sm = new IndexerStateMachine(params);

        // Cause a transient failure in CLEANUP, then let TRANSIENT_FAILURE and
        // the retry INIT complete.
        mockRunInit.mockResolvedValueOnce({ outcome: InitOutcome.UP_TO_DATE });
        mockRunCleanup.mockRejectedValueOnce(new Error('network blip'));
        mockRunTransientFailure.mockResolvedValueOnce(undefined);
        // After retrying INIT, abort so the loop terminates.
        mockRunInit.mockImplementationOnce(() => stopStateMachineViaAbort());

        await sm.start();

        expect(mockRunInit).toHaveBeenCalledTimes(2);
    });

    it('BULK_UPDATE throws InvalidIndexerState (no bridge) → goes to STOP', async () => {
        const { params, bridgeService } = makeParams();
        bridgeService.get.mockReturnValue(null); // no bridge
        const sm = new IndexerStateMachine(params);

        mockRunInit.mockResolvedValueOnce({ outcome: InitOutcome.NEEDS_BULK_UPDATE });

        await sm.start();

        expect(sm.getState()).toBe('STOP');
        expect(mockRunBulkUpdate).not.toHaveBeenCalled();
    });
});

describe('error classification', () => {
    describe('transient errors', () => {
        it('transitions to TRANSIENT_FAILURE on a generic Error', async () => {
            const { params } = makeParams();
            const sm = new IndexerStateMachine(params);

            mockRunInit.mockResolvedValueOnce({ outcome: InitOutcome.UP_TO_DATE });
            mockRunCleanup.mockRejectedValueOnce(new Error('db timeout'));
            mockRunTransientFailure.mockImplementationOnce(() => stopStateMachineViaAbort());

            await sm.start();

            expect(mockRunTransientFailure).toHaveBeenCalledTimes(1);
        });

        it('increments transientFailureCount on each failure', async () => {
            const { params } = makeParams();
            const sm = new IndexerStateMachine(params);

            // Two consecutive transient failures.
            mockRunInit.mockResolvedValue({ outcome: InitOutcome.UP_TO_DATE });
            mockRunCleanup.mockRejectedValue(new Error('flaky'));
            // Let TRANSIENT_FAILURE run twice, then abort on the third.
            let transientCallCount = 0;
            mockRunTransientFailure.mockImplementation(async () => {
                transientCallCount++;
                if (transientCallCount === 2) {
                    throw new DOMException('Aborted', 'AbortError');
                }
            });

            await sm.start();

            // The ctx passed to runTransientFailure on the second call should
            // reflect count = 2 (incremented by the machine before each entry).
            const secondCallCtx = mockRunTransientFailure.mock.calls[1][0];
            expect(secondCallCtx.transientFailureCount).toBe(2);
        });

        it('resets transientFailureCount to 0 after a full healthy cycle', async () => {
            const { params } = makeParams();
            const sm = new IndexerStateMachine(params);

            // Induce one transient failure.
            mockRunInit.mockResolvedValueOnce({ outcome: InitOutcome.UP_TO_DATE });
            mockRunCleanup.mockRejectedValueOnce(new Error('blip'));
            mockRunTransientFailure.mockResolvedValueOnce(undefined);

            // Retry: complete a full healthy cycle through SCHEDULE.
            mockRunInit.mockResolvedValueOnce({ outcome: InitOutcome.NEEDS_BULK_UPDATE });
            mockRunBulkUpdate.mockResolvedValueOnce(undefined);
            mockRunIncrementalUpdate.mockResolvedValue(undefined);
            mockRunScheduleIncrementalUpdate.mockResolvedValueOnce(undefined); // first schedule completes → machine resets counts

            // On the second SCHEDULE call, capture ctx (now post-reset) and abort.
            let capturedCtx: any;
            mockRunScheduleIncrementalUpdate.mockImplementationOnce(async (ctx) => {
                capturedCtx = ctx;
                throw new DOMException('Aborted', 'AbortError');
            });

            await sm.start();

            expect(capturedCtx.transientFailureCount).toBe(0);
            expect(capturedCtx.lastError).toBeNull();
        });
    });

    describe('permanent errors', () => {
        it('transitions to STOP on InvalidIndexerState', async () => {
            const { params } = makeParams();
            const sm = new IndexerStateMachine(params);

            mockRunInit.mockResolvedValueOnce({ outcome: InitOutcome.UP_TO_DATE });
            mockRunCleanup.mockResolvedValueOnce(undefined);
            mockRunIncrementalUpdate.mockRejectedValueOnce(new InvalidIndexerState('bad state'));

            await sm.start();

            expect(sm.getState()).toBe('STOP');
            expect(mockRunTransientFailure).not.toHaveBeenCalled();
        });

        it('transitions to STOP on SearchLibraryError', async () => {
            const { params } = makeParams();
            const sm = new IndexerStateMachine(params);

            mockRunInit.mockResolvedValueOnce({ outcome: InitOutcome.UP_TO_DATE });
            mockRunCleanup.mockResolvedValueOnce(undefined);
            mockRunIncrementalUpdate.mockRejectedValueOnce(new SearchLibraryError('WASM exploded'));

            await sm.start();

            expect(sm.getState()).toBe('STOP');
            expect(mockRunTransientFailure).not.toHaveBeenCalled();
        });

        it('transitions to STOP on QuotaExceededError', async () => {
            const { params } = makeParams();
            const sm = new IndexerStateMachine(params);

            mockRunInit.mockResolvedValueOnce({ outcome: InitOutcome.NEEDS_BULK_UPDATE });
            mockRunBulkUpdate.mockRejectedValueOnce(new DOMException('out of space', 'QuotaExceededError'));

            await sm.start();

            expect(sm.getState()).toBe('STOP');
            expect(mockRunTransientFailure).not.toHaveBeenCalled();
        });
    });

    describe('abort errors', () => {
        it('exits cleanly on AbortError without transitioning to TRANSIENT_FAILURE or STOP', async () => {
            const { params } = makeParams();
            const sm = new IndexerStateMachine(params);

            mockRunInit.mockImplementationOnce(() => stopStateMachineViaAbort());

            await sm.start();

            expect(mockRunTransientFailure).not.toHaveBeenCalled();
            expect(sm.getState()).not.toBe('STOP');
        });
    });
});

describe('onChange bridge listener', () => {
    it('re-enters BULK_UPDATE when bridge updates during BULK_UPDATE', async () => {
        const { params, triggerBridgeServiceOnChangeListener } = makeParams();
        const sm = new IndexerStateMachine(params);

        mockRunInit.mockResolvedValue({ outcome: InitOutcome.NEEDS_BULK_UPDATE });

        let bulkUpdateCalls = 0;
        mockRunBulkUpdate.mockImplementation(async (_ctx, _bridge, signal) => {
            bulkUpdateCalls++;
            if (bulkUpdateCalls === 1) {
                // Wait until aborted by the onChange handler.
                await new Promise<void>((resolve) => signal.addEventListener('abort', () => resolve()));
                throw new DOMException('Aborted', 'AbortError');
            }
            // Second invocation: exit cleanly so the background loop terminates.
            throw new DOMException('Aborted', 'AbortError');
        });

        const startPromise = sm.start();
        await flush(); // let the loop reach BULK_UPDATE

        triggerBridgeServiceOnChangeListener(); // fires while in BULK_UPDATE → abortAndReenter('BULK_UPDATE')

        await startPromise; // first loop exits after abort
        await flush(); // second (background) loop exits

        expect(bulkUpdateCalls).toBe(2);
    });

    it('re-enters INCREMENTAL_UPDATE when bridge updates during INCREMENTAL_UPDATE', async () => {
        const { params, triggerBridgeServiceOnChangeListener } = makeParams();
        const sm = new IndexerStateMachine(params);

        mockRunInit.mockResolvedValueOnce({ outcome: InitOutcome.UP_TO_DATE });
        mockRunCleanup.mockResolvedValueOnce(undefined);

        let incrementalCalls = 0;
        mockRunIncrementalUpdate.mockImplementation(async () => {
            incrementalCalls++;
            if (incrementalCalls === 1) {
                // Trigger re-entry from inside the handler (simulates async bridge update).
                triggerBridgeServiceOnChangeListener();
                // Wait a tick so the abort has been issued.
                await flush();
                throw new DOMException('Aborted', 'AbortError');
            }
            throw new DOMException('Aborted', 'AbortError');
        });

        await sm.start();
        await flush();

        expect(incrementalCalls).toBe(2);
    });

    it('does not interrupt the loop when bridge updates during INIT', async () => {
        const { params, triggerBridgeServiceOnChangeListener } = makeParams();
        const sm = new IndexerStateMachine(params);

        let initCalled = false;
        mockRunInit.mockImplementation(async () => {
            initCalled = true;
            triggerBridgeServiceOnChangeListener(); // fire while in INIT — should be a no-op
            return { outcome: InitOutcome.UP_TO_DATE };
        });
        mockRunCleanup.mockImplementationOnce(() => stopStateMachineViaAbort());

        await sm.start();

        expect(initCalled).toBe(true);
        // Only one INIT call: the onChange did not cause a re-entry.
        expect(mockRunInit).toHaveBeenCalledTimes(1);
    });

    it('does not interrupt the loop when bridge updates during TRANSIENT_FAILURE', async () => {
        const { params, triggerBridgeServiceOnChangeListener } = makeParams();
        const sm = new IndexerStateMachine(params);

        mockRunInit.mockResolvedValueOnce({ outcome: InitOutcome.NEEDS_BULK_UPDATE });
        mockRunBulkUpdate.mockRejectedValueOnce(new Error('blip'));
        mockRunTransientFailure.mockImplementationOnce(async () => {
            triggerBridgeServiceOnChangeListener(); // should be ignored in TRANSIENT_FAILURE
        });
        // After recovery, abort so we don't loop forever.
        mockRunInit.mockImplementationOnce(() => stopStateMachineViaAbort());

        await sm.start();

        // TRANSIENT_FAILURE ran once; no extra re-entry happened.
        expect(mockRunTransientFailure).toHaveBeenCalledTimes(1);
    });
});
