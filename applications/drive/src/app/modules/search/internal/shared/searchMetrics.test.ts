import metrics from '@proton/metrics';

import {
    TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS,
    TRANSIENT_REPORT_THROTTLE_MS,
    sendErrorReportForSearch,
} from './errors';
import { resetTransientReportBurstsForTests, searchMetrics } from './searchMetrics';
import type { IndexerTaskKind } from './types';

jest.mock('./Logger');

jest.mock('@proton/metrics', () => ({
    __esModule: true,
    default: {
        drive_search_initial_indexing_total: { increment: jest.fn() },
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

const TASK_KIND: IndexerTaskKind = 'index-populator-task';

const triggerTransient = (taskUid: string) =>
    searchMetrics.markIndexerError({
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
        for (let i = 0; i < TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS; i++) {
            triggerTransient('task-1');
        }
        expect(sendErrorReportMock).toHaveBeenCalledTimes(TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS);

        // The next call exceeds the burst budget and must not reach Sentry.
        triggerTransient('task-1');
        expect(sendErrorReportMock).toHaveBeenCalledTimes(TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS);

        // The metric counter, however, always increments — throttling is Sentry-only.
        expect(transientCounter).toHaveBeenCalledTimes(TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS + 1);
    });

    it('keeps silencing further calls inside the same burst window', () => {
        for (let i = 0; i < TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS + 10; i++) {
            triggerTransient('task-1');
        }
        expect(sendErrorReportMock).toHaveBeenCalledTimes(TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS);
    });

    it('opens a new burst once the throttle window elapses', () => {
        for (let i = 0; i < TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS + 1; i++) {
            triggerTransient('task-1');
        }
        expect(sendErrorReportMock).toHaveBeenCalledTimes(TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS);

        // Advance just under the window: still throttled.
        jest.advanceTimersByTime(TRANSIENT_REPORT_THROTTLE_MS - 1);
        triggerTransient('task-1');
        expect(sendErrorReportMock).toHaveBeenCalledTimes(TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS);

        // Cross the boundary: a fresh burst opens.
        jest.advanceTimersByTime(1);
        triggerTransient('task-1');
        expect(sendErrorReportMock).toHaveBeenCalledTimes(TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS + 1);
    });

    it('tracks bursts independently per task UID', () => {
        for (let i = 0; i < TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS + 1; i++) {
            triggerTransient('task-1');
        }
        expect(sendErrorReportMock).toHaveBeenCalledTimes(TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS);

        // A different task UID has its own fresh budget even while task-1 is silenced.
        triggerTransient('task-2');
        expect(sendErrorReportMock).toHaveBeenCalledTimes(TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS + 1);
    });

    it('clears the bucket when the task succeeds, restoring a fresh budget', () => {
        for (let i = 0; i < TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS + 1; i++) {
            triggerTransient('task-1');
        }
        expect(sendErrorReportMock).toHaveBeenCalledTimes(TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS);

        searchMetrics.markIndexerTaskSucceeded({ taskUid: 'task-1', taskKind: TASK_KIND });

        triggerTransient('task-1');
        expect(sendErrorReportMock).toHaveBeenCalledTimes(TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS + 1);
    });

    it('does not throttle permanent errors', () => {
        const quotaError = new DOMException('', 'QuotaExceededError');

        for (let i = 0; i < TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS + 3; i++) {
            searchMetrics.markIndexerError({ error: quotaError, taskUid: 'task-1', taskKind: TASK_KIND });
        }

        expect(sendErrorReportMock).toHaveBeenCalledTimes(TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS + 3);
        expect(sendErrorReportMock).toHaveBeenCalledWith(
            expect.stringContaining('Search permanent error'),
            quotaError,
            expect.objectContaining({
                tags: expect.objectContaining({ label: 'search-permanent-error' }),
            })
        );
    });

    it('measures the throttle window from the burst start, not from the last call', () => {
        // First call opens the burst at t=0.
        triggerTransient('task-1');

        // Spread calls across most of the window; window must NOT slide.
        jest.advanceTimersByTime(TRANSIENT_REPORT_THROTTLE_MS - 1);
        for (let i = 0; i < TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS + 5; i++) {
            triggerTransient('task-1');
        }
        expect(sendErrorReportMock).toHaveBeenCalledTimes(TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS);

        // Crossing the original window's end opens a new burst even though calls
        // were happening continuously — proving the window is anchored, not sliding.
        jest.advanceTimersByTime(1);
        triggerTransient('task-1');
        expect(sendErrorReportMock).toHaveBeenCalledTimes(TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS + 1);
    });
});
