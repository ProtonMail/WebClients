import metrics from '@proton/metrics';

import {
    SENTRY_REPORT_BURST_MAX_ATTEMPTS,
    SENTRY_REPORT_BURST_WINDOW_MS,
    SearchLibraryError,
    sendErrorReportForSearch,
} from './errors';
import { resetTransientReportBurstsForTests, searchMetrics } from './searchMetrics';
import type { IndexerTaskKind } from './types';

jest.mock('./Logger');

jest.mock('@proton/metrics', () => ({
    __esModule: true,
    default: {
        drive_search_initial_indexing_total: { increment: jest.fn() },
        drive_search_node_quarantined_total: { increment: jest.fn() },
        drive_search_node_repaired_total: { increment: jest.fn() },
        drive_search_other_error_total: { increment: jest.fn() },
        drive_search_permanent_errors_total: { increment: jest.fn() },
        drive_search_transient_errors_total: { increment: jest.fn() },
    },
}));

jest.mock('./errors', () => ({
    ...jest.requireActual('./errors'),
    sendErrorReportForSearch: jest.fn(),
}));

const sendErrorReportMock = sendErrorReportForSearch as jest.MockedFunction<typeof sendErrorReportForSearch>;
const transientCounter = metrics.drive_search_transient_errors_total.increment as jest.Mock;
const permanentCounter = metrics.drive_search_permanent_errors_total.increment as jest.Mock;

const TASK_KIND: IndexerTaskKind = 'index-populator-task';

const triggerTransient = (taskUid: string) =>
    searchMetrics.markIndexerError({
        decision: { kind: 'transient', reason: 'unknown' },
        error: new Error('boom'),
        taskUid,
        taskKind: TASK_KIND,
    });

describe('searchMetrics transient Sentry throttling', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
        resetTransientReportBurstsForTests();
        sendErrorReportMock.mockClear();
        transientCounter.mockClear();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('reports the first transient failure for a task UID', () => {
        triggerTransient('task-1');

        expect(sendErrorReportMock).toHaveBeenCalledTimes(1);
        expect(sendErrorReportMock).toHaveBeenCalledWith(
            expect.stringContaining('Search transient error'),
            expect.any(Error),
            expect.objectContaining({
                tags: expect.objectContaining({ label: 'search-transient-error', taskKind: TASK_KIND }),
            })
        );
    });

    it('reports up to MAX_REPORTED_ATTEMPTS calls within a burst, then silences', () => {
        for (let i = 0; i < SENTRY_REPORT_BURST_MAX_ATTEMPTS; i++) {
            triggerTransient('task-1');
        }
        expect(sendErrorReportMock).toHaveBeenCalledTimes(SENTRY_REPORT_BURST_MAX_ATTEMPTS);

        // The next call exceeds the burst budget and must not reach Sentry.
        triggerTransient('task-1');
        expect(sendErrorReportMock).toHaveBeenCalledTimes(SENTRY_REPORT_BURST_MAX_ATTEMPTS);

        // The metric counter, however, always increments — throttling is Sentry-only.
        expect(transientCounter).toHaveBeenCalledTimes(SENTRY_REPORT_BURST_MAX_ATTEMPTS + 1);
    });

    it('keeps silencing further calls inside the same burst window', () => {
        for (let i = 0; i < SENTRY_REPORT_BURST_MAX_ATTEMPTS + 10; i++) {
            triggerTransient('task-1');
        }
        expect(sendErrorReportMock).toHaveBeenCalledTimes(SENTRY_REPORT_BURST_MAX_ATTEMPTS);
    });

    it('opens a new burst once the throttle window elapses', () => {
        for (let i = 0; i < SENTRY_REPORT_BURST_MAX_ATTEMPTS + 1; i++) {
            triggerTransient('task-1');
        }
        expect(sendErrorReportMock).toHaveBeenCalledTimes(SENTRY_REPORT_BURST_MAX_ATTEMPTS);

        // Advance just under the window: still throttled.
        jest.advanceTimersByTime(SENTRY_REPORT_BURST_WINDOW_MS - 1);
        triggerTransient('task-1');
        expect(sendErrorReportMock).toHaveBeenCalledTimes(SENTRY_REPORT_BURST_MAX_ATTEMPTS);

        // Cross the boundary: a fresh burst opens.
        jest.advanceTimersByTime(1);
        triggerTransient('task-1');
        expect(sendErrorReportMock).toHaveBeenCalledTimes(SENTRY_REPORT_BURST_MAX_ATTEMPTS + 1);
    });

    it('tracks bursts independently per task UID', () => {
        for (let i = 0; i < SENTRY_REPORT_BURST_MAX_ATTEMPTS + 1; i++) {
            triggerTransient('task-1');
        }
        expect(sendErrorReportMock).toHaveBeenCalledTimes(SENTRY_REPORT_BURST_MAX_ATTEMPTS);

        // A different task UID has its own fresh budget even while task-1 is silenced.
        triggerTransient('task-2');
        expect(sendErrorReportMock).toHaveBeenCalledTimes(SENTRY_REPORT_BURST_MAX_ATTEMPTS + 1);
    });

    it('clears the bucket when the task succeeds, restoring a fresh budget', () => {
        for (let i = 0; i < SENTRY_REPORT_BURST_MAX_ATTEMPTS + 1; i++) {
            triggerTransient('task-1');
        }
        expect(sendErrorReportMock).toHaveBeenCalledTimes(SENTRY_REPORT_BURST_MAX_ATTEMPTS);

        searchMetrics.markIndexerTaskSucceeded({ taskUid: 'task-1', taskKind: TASK_KIND });

        triggerTransient('task-1');
        expect(sendErrorReportMock).toHaveBeenCalledTimes(SENTRY_REPORT_BURST_MAX_ATTEMPTS + 1);
    });

    it('does not throttle permanent errors', () => {
        const quotaError = new DOMException('', 'QuotaExceededError');

        for (let i = 0; i < SENTRY_REPORT_BURST_MAX_ATTEMPTS + 3; i++) {
            searchMetrics.markIndexerError({
                decision: { kind: 'permanent', reason: 'quota_exceeded' },
                error: quotaError,
                taskUid: 'task-1',
                taskKind: TASK_KIND,
            });
        }

        expect(sendErrorReportMock).toHaveBeenCalledTimes(SENTRY_REPORT_BURST_MAX_ATTEMPTS + 3);
        expect(sendErrorReportMock).toHaveBeenCalledWith(
            expect.stringContaining('Search permanent error'),
            quotaError,
            expect.objectContaining({
                // errorKind must be a tag, not just baked into the message string, so Sentry
                // issues are filterable/facetable by it - not just human-readable.
                tags: expect.objectContaining({ label: 'search-permanent-error', errorKind: 'quota_exceeded' }),
            })
        );
    });

    it('measures the throttle window from the burst start, not from the last call', () => {
        // First call opens the burst at t=0.
        triggerTransient('task-1');

        // Spread calls across most of the window; window must NOT slide.
        jest.advanceTimersByTime(SENTRY_REPORT_BURST_WINDOW_MS - 1);
        for (let i = 0; i < SENTRY_REPORT_BURST_MAX_ATTEMPTS + 5; i++) {
            triggerTransient('task-1');
        }
        expect(sendErrorReportMock).toHaveBeenCalledTimes(SENTRY_REPORT_BURST_MAX_ATTEMPTS);

        // Crossing the original window's end opens a new burst even though calls
        // were happening continuously — proving the window is anchored, not sliding.
        jest.advanceTimersByTime(1);
        triggerTransient('task-1');
        expect(sendErrorReportMock).toHaveBeenCalledTimes(SENTRY_REPORT_BURST_MAX_ATTEMPTS + 1);
    });
});

const triggerQuarantine = (populatorUid: string) =>
    searchMetrics.markNodeQuarantined({ populatorUid, operation: 'index', error: new Error('boom') });

describe('searchMetrics node-quarantine Sentry throttling', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
        resetTransientReportBurstsForTests();
        sendErrorReportMock.mockClear();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('reports the first quarantined node for a populator UID', () => {
        triggerQuarantine('pop-1');

        expect(sendErrorReportMock).toHaveBeenCalledTimes(1);
        expect(sendErrorReportMock).toHaveBeenCalledWith(
            expect.stringContaining('Adding node to repair table'),
            expect.any(Error),
            expect.objectContaining({
                tags: expect.objectContaining({ label: 'search-repair-node' }),
                extra: expect.objectContaining({ operation: 'index' }),
            })
        );
    });

    it('reports up to MAX_REPORTED_ATTEMPTS distinct nodes within a burst, then silences', () => {
        for (let i = 0; i < SENTRY_REPORT_BURST_MAX_ATTEMPTS; i++) {
            triggerQuarantine('pop-1');
        }
        expect(sendErrorReportMock).toHaveBeenCalledTimes(SENTRY_REPORT_BURST_MAX_ATTEMPTS);

        // A mass failure quarantining many more distinct nodes must not flood past the budget.
        triggerQuarantine('pop-1');
        expect(sendErrorReportMock).toHaveBeenCalledTimes(SENTRY_REPORT_BURST_MAX_ATTEMPTS);
    });

    it('tracks bursts independently per populator UID', () => {
        for (let i = 0; i < SENTRY_REPORT_BURST_MAX_ATTEMPTS + 1; i++) {
            triggerQuarantine('pop-1');
        }
        expect(sendErrorReportMock).toHaveBeenCalledTimes(SENTRY_REPORT_BURST_MAX_ATTEMPTS);

        // A different populator UID has its own fresh budget even while pop-1 is silenced.
        triggerQuarantine('pop-2');
        expect(sendErrorReportMock).toHaveBeenCalledTimes(SENTRY_REPORT_BURST_MAX_ATTEMPTS + 1);
    });

    it('opens a new burst once the throttle window elapses', () => {
        for (let i = 0; i < SENTRY_REPORT_BURST_MAX_ATTEMPTS + 1; i++) {
            triggerQuarantine('pop-1');
        }
        expect(sendErrorReportMock).toHaveBeenCalledTimes(SENTRY_REPORT_BURST_MAX_ATTEMPTS);

        jest.advanceTimersByTime(SENTRY_REPORT_BURST_WINDOW_MS);
        triggerQuarantine('pop-1');
        expect(sendErrorReportMock).toHaveBeenCalledTimes(SENTRY_REPORT_BURST_MAX_ATTEMPTS + 1);
    });

    it('is independent from the transient-error throttle bucket', () => {
        for (let i = 0; i < SENTRY_REPORT_BURST_MAX_ATTEMPTS + 1; i++) {
            triggerTransient('shared-uid');
        }
        expect(sendErrorReportMock).toHaveBeenCalledTimes(SENTRY_REPORT_BURST_MAX_ATTEMPTS);

        // Same UID string used as a populator UID still gets its own fresh quarantine budget.
        triggerQuarantine('shared-uid');
        expect(sendErrorReportMock).toHaveBeenCalledTimes(SENTRY_REPORT_BURST_MAX_ATTEMPTS + 1);
    });
});

describe('searchMetrics markIndexerError decision handling', () => {
    beforeEach(() => {
        sendErrorReportMock.mockClear();
        permanentCounter.mockClear();
        transientCounter.mockClear();
    });

    it('uses the supplied decision, not the (bridge-degraded) error, to pick the counter', () => {
        // Simulates what Comlink does to the error on its way out of the SharedWorker: the
        // subclass prototype and the custom `name` are both lost, so no `instanceof` or
        // name-based check in classifyError could recover the kind on the main thread.
        const degraded = structuredClone(new SearchLibraryError('Unable to upsert node', null));
        expect(degraded).not.toBeInstanceOf(SearchLibraryError);
        expect(degraded.name).toBe('Error');

        searchMetrics.markIndexerError({
            decision: { kind: 'permanent', reason: 'search_library_error' },
            error: degraded,
            taskUid: 'task-1',
            taskKind: TASK_KIND,
        });

        expect(permanentCounter).toHaveBeenCalledWith({ errorKind: 'search_library_error' });
        expect(transientCounter).not.toHaveBeenCalled();
        expect(sendErrorReportMock).toHaveBeenCalledWith(
            'Search permanent error (search_library_error)',
            degraded,
            expect.objectContaining({
                tags: expect.objectContaining({ label: 'search-permanent-error', errorKind: 'search_library_error' }),
            })
        );
    });

    it('keeps the transient reason supplied by the worker instead of re-deriving it', () => {
        // An offline error is detected by `name`, which structured clone also destroys.
        const degraded = structuredClone(Object.assign(new Error('offline'), { name: 'OfflineError' }));
        expect(degraded.name).toBe('Error');

        searchMetrics.markIndexerError({
            decision: { kind: 'transient', reason: 'offline' },
            error: degraded,
            taskUid: 'task-1',
            taskKind: TASK_KIND,
        });

        expect(transientCounter).toHaveBeenCalledWith({ kind: 'offline' });
        expect(permanentCounter).not.toHaveBeenCalled();
    });
});
