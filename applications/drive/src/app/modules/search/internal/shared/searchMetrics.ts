import metrics from '@proton/metrics';

import { Logger } from './Logger';
import {
    type PermanentErrorKind,
    TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS,
    TRANSIENT_REPORT_THROTTLE_MS,
    type TransientErrorKind,
    classifyError,
    sendErrorReportForSearch,
} from './errors';
import type { IndexerTaskKind } from './types';

/**
 * High-level event surface for the search module — works in both main thread and SharedWorker.
 *
 * Each `mark*` method describes what happened and the metric module decides what to do
 * (counter, histogram, Sentry with feature label, throttling).
 *
 * `searchMetrics` emits with `searchVersion: 'v1'`. The sibling `legacySearchMetrics`
 * exposes the same histograms tagged `searchVersion: 'legacy'` for the legacy ES (encrypted-search) path.
 */

const SEARCH_VERSION_V1 = 'v1';
const SEARCH_VERSION_LEGACY = 'legacy';

export type SearchPermanentErrorKind = PermanentErrorKind;

export type SearchTransientErrorKind = TransientErrorKind;

export type SearchEnvironmentIncompatibilityReason =
    | 'safari_too_old'
    | 'shared_worker_unsupported'
    | 'indexed_db_unsupported'
    | 'indexed_db_probe_failed'
    | 'mobile';

export type SearchOptInKind = 'manual' | 'legacy_auto_upgrade';

export type SearchWorkerHealthErrorKind = 'heartbeat-timeout' | 'heartbeat-error' | 'reconnect-failure';

// Per-task-UID Sentry-report bursts. Each burst allows up to MAX_REPORTED_ATTEMPTS
// reports; after TRANSIENT_REPORT_THROTTLE_MS from the burst start, a new burst opens
// so ongoing problems remain visible without flooding. The bucket is also cleared
// when the task succeeds (see `markIndexerTaskSucceeded`), mirroring the queue's
// per-UID retry counter so a recovered task gets a fresh reporting budget.
const transientReportBursts = new Map<string, { count: number; windowStartedAt: number }>();

function shouldReportTransientToSentry(taskUid: string): boolean {
    const now = Date.now();
    const existing = transientReportBursts.get(taskUid);
    const burst =
        !existing || now - existing.windowStartedAt >= TRANSIENT_REPORT_THROTTLE_MS
            ? { count: 1, windowStartedAt: now }
            : { count: existing.count + 1, windowStartedAt: existing.windowStartedAt };
    transientReportBursts.set(taskUid, burst);
    return burst.count <= TRANSIENT_ERRORS_MAX_REPORTED_ATTEMPTS;
}

export const searchMetrics = {
    /**
     * Indexer task failed. Classifies the error, increments severity counter
     * (permanent / transient), increments lifecycle counter (when
     * `isInitialIndexing` / `isIncrementalUpdate` is set), and sends to Sentry.
     * Transient Sentry calls are throttled per `taskUid` to avoid flooding when a single
     * task keeps flapping; the throttle window resets when the task succeeds (see
     * `markIndexerTaskSucceeded`).
     */
    markIndexerError({
        error,
        taskUid,
        taskKind,
        isInitialIndexing,
        isIncrementalUpdate,
    }: {
        error: unknown;
        taskUid: string;
        taskKind: IndexerTaskKind;
        isInitialIndexing?: boolean;
        isIncrementalUpdate?: boolean;
    }): void {
        const decision = classifyError(error);

        if (isInitialIndexing) {
            metrics.drive_search_initial_indexing_total.increment({ outcome: 'failure' });
        }
        if (isIncrementalUpdate) {
            // TODO: add missing metric (no schema yet).
        }

        if (decision.kind === 'permanent') {
            metrics.drive_search_permanent_errors_total.increment({ errorKind: decision.reason });
            sendErrorReportForSearch(`Search permanent error (${decision.reason})`, error, {
                tags: { label: 'search-permanent-error', taskKind },
            });
        } else {
            // TODO: pass transientErrorKind to metric once schema supports it.
            metrics.drive_search_transient_errors_total.increment({});
            if (shouldReportTransientToSentry(taskUid)) {
                sendErrorReportForSearch(`Search transient error (${decision.reason})`, error, {
                    tags: { label: 'search-transient-error', taskKind },
                });
            } else {
                Logger.error(`Search transient error (${decision.reason}) [Sentry-throttled]`, error);
            }
        }
    },

    /**
     * An indexer task ran to completion.
     */
    markIndexerTaskSucceeded({ taskUid, taskKind }: { taskUid: string; taskKind: IndexerTaskKind }): void {
        // Clears its transient-error throttle bucket so any future failure starts
        // with a fresh reporting budget/
        transientReportBursts.delete(taskUid);

        if (taskKind === 'incremental-update-task') {
            // TODO: add missing metric (no schema yet).
        }
    },

    /**
     * `SearchModule.isEnvironmentCompatible` rejected a client. Tracks per-reason
     * opt-out cohort. Run once per web session.
     */
    markIncompatibilityEnvironment({ reason }: { reason: SearchEnvironmentIncompatibilityReason }): void {
        metrics.drive_search_environment_incompatibility_total.increment({ reason });
    },

    /**
     * User turned search on. `legacy_auto_upgrade` covers users migrated from the
     * legacy ES library; `manual` covers explicit opt-in via UI.
     */
    markOptIn({ kind }: { kind: SearchOptInKind }): void {
        metrics.drive_search_opt_in_total.increment({ kind });
    },

    /**
     * Initial indexing run completed. Increments lifecycle counter and observes
     * the duration histogram.
     */
    markInitialIndexingSucceeded({ durationInSeconds }: { durationInSeconds: number }): void {
        metrics.drive_search_initial_indexing_total.increment({ outcome: 'success' });
        metrics.drive_search_index_build_time_histogram.observe({
            Labels: { searchVersion: SEARCH_VERSION_V1 },
            Value: durationInSeconds,
        });
    },

    /**
     * Search query completed. Increments lifecycle counter and observes the
     * duration histogram.
     */
    markSearchQuerySucceeded({ durationInSeconds }: { durationInSeconds: number }): void {
        metrics.drive_search_query_total.increment({ outcome: 'success' });
        metrics.drive_search_query_time_histogram.observe({
            Labels: { searchVersion: SEARCH_VERSION_V1 },
            Value: durationInSeconds,
        });
    },

    /**
     * Search query failed. Increments lifecycle counter and sends to Sentry
     * with `label: 'search-query-error'`
     */
    markSearchQueryFailed({ error }: { error: unknown }): void {
        metrics.drive_search_query_total.increment({ outcome: 'failure' });
        sendErrorReportForSearch('Search query failed', error, {
            tags: { label: 'search-query-error' },
        });
    },

    /**
     * SharedWorker connection-health error.
     */
    markWorkerHealthError({ kind, error }: { kind: SearchWorkerHealthErrorKind; error: unknown }): void {
        sendErrorReportForSearch(`Search worker health error (${kind})`, error, {
            tags: { label: 'search-worker-health-error', kind },
        });
    },

    /**
     * A connected client (tab) missed its heartbeat window and was force-disconnected
     * by the SharedWorker.
     */
    markClientDisconnectTimeout({
        staleness,
        remainingClients,
    }: {
        staleness: number;
        remainingClients: number;
    }): void {
        sendErrorReportForSearch(
            'Search client disconnected by timeout',
            new Error('Search client disconnected by timeout'),
            {
                tags: { label: 'search-client-disconnect-timeout' },
                extra: { staleness, remainingClients },
            }
        );
    },

    /**
     * Per-cleanup-run delta of blobs reclaimed (released + orphans).
     */
    markBlobsCleanup({ removedBlobsCount }: { removedBlobsCount: number }): void {
        metrics.drive_search_cleanup_blobs_removed_histogram.observe({
            Labels: {},
            Value: removedBlobsCount,
        });
    },

    /**
     * Persisted index size in megabytes at module init time.
     */
    markIndexSizeOnInit({ sizeMb }: { sizeMb: number }): void {
        metrics.drive_search_index_size_histogram.observe({
            Labels: { searchVersion: SEARCH_VERSION_V1 },
            Value: sizeMb,
        });
    },

    /**
     * Convenience: returns a function that yields elapsed seconds on call.
     * Use with `mark*Succeeded({ durationInSeconds })` methods, e.g.
     *
     *   const stop = searchMetrics.startTimer();
     *   await doWork();
     *   searchMetrics.markSearchQuerySucceeded({ durationInSeconds: stop() });
     */
    startTimer(): () => number {
        const start = performance.now();
        return () => (performance.now() - start) / 1000;
    },
};

export type SearchMetrics = typeof searchMetrics;

/**
 * Test-only: clear the in-module transient-error throttle state so tests don't
 * inherit Sentry-bucket counters from previous test cases. Production code never
 * needs this — entries are bounded by the number of distinct task UIDs and the
 * SharedWorker is recreated on browser reload.
 */
export function resetTransientReportBurstsForTests(): void {
    transientReportBursts.clear();
}

/**
 * Mirror of the histograms exposed by `searchMetrics`, tagged with
 * `searchVersion: 'legacy'` for emission from the legacy ES path.
 * Same units as `searchMetrics` (seconds, megabytes).
 */
export const legacySearchMetrics = {
    observeInitialIndexingDuration(durationInSeconds: number): void {
        metrics.drive_search_index_build_time_histogram.observe({
            Labels: { searchVersion: SEARCH_VERSION_LEGACY },
            Value: durationInSeconds,
        });
    },

    observeSearchQueryDuration(durationInSeconds: number): void {
        metrics.drive_search_query_time_histogram.observe({
            Labels: { searchVersion: SEARCH_VERSION_LEGACY },
            Value: durationInSeconds,
        });
    },

    observeIndexSizeOnInit(sizeMb: number): void {
        metrics.drive_search_index_size_histogram.observe({
            Labels: { searchVersion: SEARCH_VERSION_LEGACY },
            Value: sizeMb,
        });
    },
};

export type LegacySearchMetrics = typeof legacySearchMetrics;
