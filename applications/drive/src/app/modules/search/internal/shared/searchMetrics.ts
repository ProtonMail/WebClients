import metrics from '@proton/metrics';
import type { HttpsProtonMeWebDriveSearchEnvironmentIncompatibilityTotalV1SchemaJson } from '@proton/metrics/types/web_drive_search_environment_incompatibility_total_v1.schema';
import type { HttpsProtonMeWebDriveSearchPermanentErrorsTotalV1SchemaJson } from '@proton/metrics/types/web_drive_search_permanent_errors_total_v1.schema';

import { Logger } from './Logger';
import type { RepairOperation } from './SearchDB';
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

/** Storage/index snapshot attached to an error report for debugging context. */
export type SearchDiagnostics = {
    blobCount: number;
    blobsTotalSizeMb: number;
    quarantinedNodeCount: number;
    storageUsageMb: number;
    storageQuotaMb: number;
    documentCount: number | undefined;
    // In-memory IndexBlobStore number of blobs in cache.
    blobCacheEntryCount: number | undefined;
    // "/"-joined MB size per cached blob, ordered from highest priority (evicted last) to lowest
    // (evicted first) - see Cached.priority(). Undefined under the same conditions as the other
    // blobCache* fields.
    blobCacheSizesMb: string | undefined;
    // Number of blob cache being pending release.
    blobCachePendingFreeCount: number | undefined;
    // WASM linear memory high-water mark, in MB. Undefined before the module has loaded.
    wasmMemoryMb: number | undefined;
    // How long the last successful index commit took, in ms, undefined if none yet.
    lastCommitDurationMs: number | undefined;
};

const PERMANENT_ERROR_METRIC_KIND: Record<
    PermanentErrorKind,
    HttpsProtonMeWebDriveSearchPermanentErrorsTotalV1SchemaJson['Labels']['errorKind']
> = {
    quota_exceeded: 'quota_exceeded',
    corrupted_db: 'corrupted_db',
    invalid_indexer_state: 'invalid_indexer_state',
    search_library_error: 'search_library_error',
    // TODO: Consider adding a crypto enum value in grafana.
    search_crypto_error: 'unknown',
};

export type SearchTransientErrorKind = TransientErrorKind;

export type SearchEnvironmentIncompatibilityReason =
    | 'safari_too_old'
    | 'shared_worker_unsupported'
    | 'indexed_db_unsupported'
    | 'indexed_db_probe_failed'
    | 'mobile'
    | 'webassembly_unsupported'
    | 'chrome_too_old';

const ENVIRONMENT_INCOMPATIBILITY_METRIC_REASON: Record<
    SearchEnvironmentIncompatibilityReason,
    HttpsProtonMeWebDriveSearchEnvironmentIncompatibilityTotalV1SchemaJson['Labels']['reason']
> = {
    safari_too_old: 'safari_too_old',
    shared_worker_unsupported: 'shared_worker_unsupported',
    indexed_db_unsupported: 'indexed_db_unsupported',
    indexed_db_probe_failed: 'indexed_db_probe_failed',
    mobile: 'mobile',
    // TODO: Consider adding a webassembly enum value in grafana.
    webassembly_unsupported: 'unknown',
    // TODO: Consider adding a obsolete_browser enum value in grafana.
    chrome_too_old: 'unknown',
};

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

/**
 * Logs the storage/index snapshot as a breadcrumb and returns it for use as `extra` on the Sentry
 * report - so it's guaranteed to land on that exact event, not just rely on breadcrumb-channel
 * ordering. `diagnostics` is `undefined` when gathering it failed on the caller's side (see
 * `gatherSearchDiagnostics`) - that must not block reporting of the real error, so this just
 * omits the extra context rather than throwing. `taskAttemptCount` only applies to indexer task
 * errors, not search query errors.
 */
function reportSearchDiagnosticsBreadcrumb(
    diagnostics: SearchDiagnostics | undefined,
    taskAttemptCount?: number
): Record<string, unknown> | undefined {
    if (!diagnostics) {
        return undefined;
    }
    Logger.debug(
        `Search diagnostics: blobs=${diagnostics.blobCount} (${diagnostics.blobsTotalSizeMb.toFixed(1)}MB), ` +
            `documents=${diagnostics.documentCount ?? 'unknown'}, quarantined=${diagnostics.quarantinedNodeCount}, ` +
            `storage=${diagnostics.storageUsageMb.toFixed(1)}/${diagnostics.storageQuotaMb.toFixed(1)}MB, ` +
            `blobCache=${diagnostics.blobCacheEntryCount ?? 'unknown'}` +
            (diagnostics.blobCachePendingFreeCount ? ` (+${diagnostics.blobCachePendingFreeCount} pending free)` : '') +
            (diagnostics.blobCacheSizesMb ? `, blobSizesMb=${diagnostics.blobCacheSizesMb}` : '') +
            `, wasmMemory=${diagnostics.wasmMemoryMb !== undefined ? `${diagnostics.wasmMemoryMb.toFixed(1)}MB` : 'unknown'}` +
            `, lastCommit=${diagnostics.lastCommitDurationMs !== undefined ? `${diagnostics.lastCommitDurationMs}ms` : 'never'}` +
            (taskAttemptCount !== undefined ? `, attempt=${taskAttemptCount}` : '')
    );
    return taskAttemptCount !== undefined ? { ...diagnostics, taskAttemptCount } : { ...diagnostics };
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
     * intact; only the decision may cross the bridge. `error` is kept for Sentry.
     */
    markIndexerError({
        decision,
        error,
        taskUid,
        taskKind,
        isInitialIndexing,
        isIncrementalUpdate,
        isInitialAttempt,
        taskAttemptCount,
        diagnostics,
    }: {
        decision: ErrorDecision;
        error: unknown;
        taskUid: string;
        taskKind: IndexerTaskKind;
        isInitialIndexing?: boolean;
        isIncrementalUpdate?: boolean;
        /** Required when `isInitialIndexing` is set: false when this failure follows a prior retry. */
        isInitialAttempt?: boolean;
        /** Number of prior failed attempts for this task, before this one. */
        taskAttemptCount: number;
        /** Storage/index snapshot gathered by the caller, `undefined` if gathering it failed. Must
         * be plain, structured-clone-safe data - this method may run across the worker bridge. */
        diagnostics: SearchDiagnostics | undefined;
    }): void {
        if (isInitialIndexing) {
            metrics.drive_search_initial_indexing_total.increment({
                outcome: 'failure',
                isInitialAttempt: isInitialAttempt ? 'true' : 'false',
            });
        }
        if (isIncrementalUpdate) {
            metrics.drive_search_incremental_update_total.increment({ outcome: 'failure' });
        }

        if (decision.kind === 'permanent') {
            metrics.drive_search_permanent_errors_total.increment({
                errorKind: PERMANENT_ERROR_METRIC_KIND[decision.reason],
            });
            sendErrorReportForSearch(`Search permanent error (${decision.reason})`, error, {
                tags: { label: 'search-permanent-error', taskKind, errorKind: decision.reason },
                extra: reportSearchDiagnosticsBreadcrumb(diagnostics, taskAttemptCount),
            });
        } else {
            metrics.drive_search_transient_errors_total.increment({ kind: decision.reason });
            if (decision.reason === 'offline') {
                // Offline is the user's connectivity, not a defect. It stays visible through the
                // Grafana counter incremented just above and a local log line, but it must not open a
                // Sentry issue, nor spend a burst slot that a real error will need.
                Logger.info('Search transient error: offline');
            } else if (shouldReportTransientToSentry(taskUid)) {
                sendErrorReportForSearch(`Search transient error (${decision.reason})`, error, {
                    tags: { label: 'search-transient-error', taskKind, kind: decision.reason },
                    extra: reportSearchDiagnosticsBreadcrumb(diagnostics, taskAttemptCount),
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
        metrics.drive_search_environment_incompatibility_total.increment({
            reason: ENVIRONMENT_INCOMPATIBILITY_METRIC_REASON[reason],
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
    markInitialIndexingSucceeded({
        durationInSeconds,
        isInitialAttempt,
    }: {
        durationInSeconds: number;
        /** False when this success follows one or more retried attempts. */
        isInitialAttempt: boolean;
    }): void {
        metrics.drive_search_initial_indexing_total.increment({
            outcome: 'success',
            isInitialAttempt: isInitialAttempt ? 'true' : 'false',
        });
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
    markSearchQueryFailed({
        error,
        diagnostics,
    }: {
        error: unknown;
        diagnostics: SearchDiagnostics | undefined;
    }): void {
        metrics.drive_search_query_total.increment({ outcome: 'failure' });
        sendErrorReportForSearch('Search query failed', error, {
            tags: { label: 'search-query-error' },
            extra: reportSearchDiagnosticsBreadcrumb(diagnostics),
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
        operation: RepairOperation;
        error: unknown;
    }): void {
        metrics.drive_search_node_quarantined_total.increment({ operation });

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
    markNodeRepaired({ operation }: { operation: RepairOperation }): void {
        metrics.drive_search_node_repaired_total.increment({ operation });
    },

    /**
     * Report other search error.
     */
    markSearchOtherError({ error }: { error: unknown }): void {
        metrics.drive_search_other_error_total.increment({});

        sendErrorReportForSearch('Search other error', error, {
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
