import metrics from '@proton/metrics';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';

import { Logger } from './Logger';
import {
    type ErrorDecision,
    type PermanentErrorKind,
    SENTRY_REPORT_BURST_MAX_ATTEMPTS,
    SENTRY_REPORT_BURST_WINDOW_MS,
    type TransientErrorKind,
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
    'safari_too_old' | 'shared_worker_unsupported' | 'indexed_db_unsupported' | 'indexed_db_probe_failed' | 'mobile';

export type SearchOptInKind = 'manual' | 'legacy_auto_upgrade';

export type SearchWorkerHealthErrorKind = 'heartbeat-timeout' | 'heartbeat-error' | 'reconnect-failure';

// Sentry-report burst tracker shared by the two throttles below: each burst allows up to
// SENTRY_REPORT_BURST_MAX_ATTEMPTS reports; after SENTRY_REPORT_BURST_WINDOW_MS from the burst
// start, a new burst opens so ongoing problems remain visible without flooding.
function shouldReportToSentry(bursts: Map<string, { count: number; windowStartedAt: number }>, key: string): boolean {
    const now = Date.now();
    const existing = bursts.get(key);
    const burst =
        !existing || now - existing.windowStartedAt >= SENTRY_REPORT_BURST_WINDOW_MS
            ? { count: 1, windowStartedAt: now }
            : { count: existing.count + 1, windowStartedAt: existing.windowStartedAt };
    bursts.set(key, burst);
    return burst.count <= SENTRY_REPORT_BURST_MAX_ATTEMPTS;
}

// Structure to store the burst of transient errors.
const transientReportBursts = new Map<string, { count: number; windowStartedAt: number }>();

function shouldReportTransientToSentry(taskUid: string): boolean {
    return shouldReportToSentry(transientReportBursts, taskUid);
}

// Structure to store the burst of broken node errors (and associated quarantine operations).
const quarantineReportBursts = new Map<string, { count: number; windowStartedAt: number }>();

function shouldReportQuarantineToSentry(populatorUid: string): boolean {
    return shouldReportToSentry(quarantineReportBursts, populatorUid);
}

export const searchMetrics = {
    /**
     * Indexer task failed. Increments severity counter (permanent / transient), increments
     * lifecycle counter (when `isInitialIndexing` / `isIncrementalUpdate` is set), and sends
     * to Sentry. Transient Sentry calls are throttled per `taskUid` to avoid flooding when a
     * single task keeps flapping; the throttle window resets when the task succeeds (see
     * `markIndexerTaskSucceeded`).
     *
     * The caller supplies the already-computed `decision` because this method may run on the
     * far side of the worker bridge, where structured clone has stripped the error's prototype,
     * its `name` and its own properties (e.g. `status`) - leaving every `instanceof` / name /
     * status check in `classifyError` unable to match, so everything would bucket as
     * transient-`unknown`. Classification must happen in the worker while the error is still
     * intact; only the plain-string verdict may cross the bridge. `error` is kept for Sentry.
     */
    markIndexerError({
        decision,
        error,
        taskUid,
        taskKind,
        isInitialIndexing,
        isIncrementalUpdate,
    }: {
        decision: ErrorDecision;
        error: unknown;
        taskUid: string;
        taskKind: IndexerTaskKind;
        isInitialIndexing?: boolean;
        isIncrementalUpdate?: boolean;
    }): void {
        if (isInitialIndexing) {
            metrics.drive_search_initial_indexing_total.increment({ outcome: 'failure' });
        }
        if (isIncrementalUpdate) {
            metrics.drive_search_incremental_update_total.increment({ outcome: 'failure' });
        }

        if (decision.kind === 'permanent') {
            metrics.drive_search_permanent_errors_total.increment({ errorKind: decision.reason });
            sendErrorReportForSearch(`Search permanent error (${decision.reason})`, error, {
                tags: { label: 'search-permanent-error', taskKind, errorKind: decision.reason },
            });
        } else {
            metrics.drive_search_transient_errors_total.increment({ kind: decision.reason });
            if (shouldReportTransientToSentry(taskUid)) {
                sendErrorReportForSearch(`Search transient error (${decision.reason})`, error, {
                    tags: { label: 'search-transient-error', taskKind, kind: decision.reason },
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
        // with a fresh reporting budget.
        transientReportBursts.delete(taskUid);

        if (taskKind === 'incremental-update-task') {
            metrics.drive_search_incremental_update_total.increment({ outcome: 'success' });
        }
    },

    /**
     * `SearchModule.isEnvironmentCompatible` rejected a client. Tracks per-reason
     * opt-out cohort. Run once per web session.
     */
    markIncompatibilityEnvironment({ reason }: { reason: SearchEnvironmentIncompatibilityReason }): void {
        metrics.drive_search_environment_incompatibility_total.increment({ reason });

        // NOTE: Report to sentry to analyze these incompatible user agents.
        captureMessage('Search: incompatible env detected', {
            level: 'debug',
            tags: { component: 'search', reason },
        });
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
     * A node was skipped during indexing after a node-scoped failure and recorded in the repair
     * table for later re-processing.
     */
    markNodeQuarantined({
        populatorUid,
        operation,
        error,
    }: {
        populatorUid: string;
        operation: string;
        error: unknown;
    }): void {
        // TODO(DRVWEB-5567): Add grafana metric.

        if (shouldReportQuarantineToSentry(populatorUid)) {
            sendErrorReportForSearch('Adding node to repair table', error, {
                tags: { label: 'search-repair-node' },
                extra: { operation },
            });
        } else {
            Logger.error(`${populatorUid}: quarantined node (${operation}) [Sentry-throttled]`, error);
        }
    },

    /**
     * A previously-quarantined node was reprocessed successfully and removed from the repair table.
     */
    markNodeRepaired(): void {
        // TODO(DRVWEB-5567): Add grafana metric.
    },

    /**
     * Report other search error.
     */
    markSearchOtherError({ error }: { error: unknown }): void {
        // TODO(DRVWEB-5567): Add grafana metric.

        sendErrorReportForSearch('Search unknown error', error, {
            tags: { label: 'search-other-errors' },
        });
    },
};

export type SearchMetrics = typeof searchMetrics;

/**
 * Returns a function that yields elapsed seconds on call.
 */
export function startSearchTimer(): () => number {
    const start = performance.now();
    return () => (performance.now() - start) / 1000;
}

/**
 * Test-only: clear the in-module transient-error and node-quarantine throttle state so tests
 * don't inherit Sentry-bucket counters from previous test cases. Production code never needs
 * this - entries are bounded by the number of distinct task/populator UIDs and the SharedWorker
 * is recreated on browser reload.
 */
export function resetTransientReportBurstsForTests(): void {
    transientReportBursts.clear();
    quarantineReportBursts.clear();
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
