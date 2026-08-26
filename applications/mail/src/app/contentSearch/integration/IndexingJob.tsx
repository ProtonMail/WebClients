import type { ESIndexingState, ESTimepoint } from '@proton/encrypted-search/models';

import type { ImportHandle } from '../import/ImportHandle';
import type { IndexService } from '../indexation/IndexService';
import type { ESStatusConcrete } from './ESAdapter';

/**
 * Content-search indexing runs as two actions, one after another: v1 builds its index (the bulk of
 * the time), then the v2 import copies from it. This models that pair as a single job with one
 * lifetime, so the UI keeps a coherent status across the handoff instead of v1's bar vanishing and
 * the toggle flipping on while the import is still running.
 *
 * Progress is shown as two separate 0→100 bars, one per phase, each reporting that phase's own real
 * item count. (A single blended bar was tried, but its "X out of Y" line reported the wrong download
 * count — it scaled the count by the phase weight, so it read ~80% when v1 had actually finished.)
 * The *remaining time*, in contrast, is whole-process: during v1 its estimate is scaled up by
 * {@link V1_WEIGHT} to account for the import still to come, and during the import (the last phase) it
 * is simply the import's own estimate. So the bar restarts at the handoff but the ETA keeps counting
 * down across both.
 *
 * - `index` mode: a fresh index. v1 owns the bar during its phase; at the v1→import handoff the bar
 *   resets and the import owns it. Status is held "enabling" until the *import* finishes.
 * - `refresh` mode: a post-event update. Runs the import in the background with no UI of its own,
 *   exactly like v1's routine event sync (which shows no progress bar), spanning the sync wait and
 *   the import.
 */
export type JobMode = 'index' | 'refresh';

/**
 * Fraction of total wall-clock the v1 phase takes (the import is the rest). Used only to scale v1's
 * remaining-time estimate into whole-process terms — the progress bar itself is per-phase. A wrong
 * value just makes the ETA jump a little at the v1→import handoff.
 */
const V1_WEIGHT = 0.9;

interface JobDeps {
    indexService: IndexService;
    /** The current v1 status, so the job can spread it while overriding a couple of flags. */
    initialV1Status: ESStatusConcrete;
    updateESStatus: (status: ESStatusConcrete) => void;
    updateESProgress: (timepoint: ESTimepoint, progressState: ESIndexingState) => void;
    /**
     * Resolves once v1's syncing queue has drained. A refresh import reads from the v1 ES database, so
     * it must wait for the event that triggered it to actually land there first (otherwise it imports
     * from a stale DB). Reads the current v1 instance at call time.
     */
    waitForV1Sync: () => Promise<void>;
    /** Called once the import completes so the adapter can drop its reference to this job. */
    onFinished: () => void;
}

export class IndexingJob {
    private phase: 'v1' | 'v1-sync' | 'import' | 'done';
    private lastV1Status: ESStatusConcrete;
    private handle?: ImportHandle;
    private unsubscribe?: () => void;
    private abandoned = false;

    constructor(
        private readonly deps: JobDeps,
        private readonly mode: JobMode
    ) {
        this.lastV1Status = deps.initialV1Status;
        if (mode === 'refresh') {
            // A refresh imports the messages the event touched, but first has to wait for that event to
            // land in the v1 ES DB (the import's source). That wait is its own phase so that `import`
            // means only one thing: the actual import is running.
            this.phase = 'v1-sync';
            this.startSync();
        } else {
            this.phase = 'v1';
        }
    }

    /** Feed a v1 status update while the job is live. */
    onV1Status(v1Status: ESStatusConcrete) {
        this.lastV1Status = v1Status;
        // v1 content indexing just finished -> hand off to the import, keeping the bar up.
        if (this.mode === 'index' && this.phase === 'v1' && v1Status.contentIndexingDone) {
            this.startImport();
        } else {
            this.emitStatus();
        }
    }

    /** Feed a v1 progress update; only meaningful during the v1 phase, where v1 owns the bar. */
    onV1Progress(timepoint: ESTimepoint, progressState: ESIndexingState) {
        if (this.phase !== 'v1' || this.abandoned) {
            return;
        }
        // Bar/count: v1's real numbers, 0→100. Remaining time: scale v1's estimate up to whole-process
        // terms (it's only V1_WEIGHT of the total), so the ETA already accounts for the coming import.
        const estimatedMinutes =
            progressState.estimatedMinutes > 0 ? Math.ceil(progressState.estimatedMinutes / V1_WEIGHT) : 0;
        this.deps.updateESProgress(timepoint, { ...progressState, estimatedMinutes });
    }

    /** Stop touching the setters — used when the adapter tears the job down (e.g. esDelete). */
    dispose() {
        this.abandoned = true;
        this.unsubscribe?.();
        // The import's source is the v1 ES DB, and a teardown means that DB is going away (esDelete, or
        // v1 wiping its own index after an error). Leaving the import running would have it read from a
        // database being deleted underneath it, so stop it as well.
        this.handle?.stop();
    }

    /**
     * Refresh only: wait for v1's syncing queue to drain, then start the import. The import reads from
     * the v1 ES DB, so the triggering event must have landed there first — otherwise we'd import from
     * a stale database. No UI during the wait (see `emitStatus`).
     */
    private startSync() {
        this.emitStatus();
        this.deps
            .waitForV1Sync()
            .then(() => {
                if (this.abandoned) {
                    return;
                }
                this.startImport();
            })
            .catch((err) => {
                // If the sync wait fails, the job can't proceed — but it must still terminate, or the
                // "refreshing" status stays on forever.
                console.error(err);
                this.finish();
            });
    }

    private startImport() {
        this.phase = 'import';
        this.emitStatus();
        this.emitImportProgress(); // resets the bar to 0 for the import's own 0→100

        this.deps.indexService
            .importFromEncryptedSearch()
            .then((handle) => {
                if (this.abandoned) {
                    // Torn down while the import was starting up — `dispose` couldn't stop a handle it
                    // hadn't seen yet, so stop it here.
                    handle?.stop();
                    return;
                }
                if (!handle) {
                    // Nothing to import (no v1 DB / no key) -> the job is complete.
                    this.finish();
                    return;
                }
                this.handle = handle;
                this.unsubscribe = handle.onProgress.subscribe((p) => {
                    if (this.abandoned) {
                        return;
                    }
                    this.emitImportProgress();
                    if (p >= 1) {
                        this.finish();
                    }
                });
                // createListeners doesn't replay: if the import already finished before we
                // subscribed, catch up manually.
                if (!handle.running) {
                    this.finish();
                }
            })
            .catch((err) => {
                // The import failed to even start (e.g. key derivation / worker setup threw). Terminate
                // so the status clears instead of hanging on "updating"/"enabling" indefinitely.
                console.error(err);
                this.finish();
            });
    }

    private finish() {
        if (this.phase === 'done' || this.abandoned) {
            return;
        }
        this.phase = 'done';
        this.emitStatus();
        this.emitImportProgress();
        this.deps.onFinished();
    }

    /** Emit the import's own 0→100 progress (index mode only; a refresh shows no bar). */
    private emitImportProgress() {
        if (this.abandoned || this.mode !== 'index') {
            return;
        }
        // Count is the real completed/total; the bar uses the slowdown-corrected fraction so it tracks
        // time rather than raw item count.
        const total = this.handle?.total ?? 0;
        const completed = this.handle?.completed ?? 0;
        this.deps.updateESProgress([completed, total], {
            esProgress: completed,
            totalIndexingItems: total,
            currentProgressValue: Math.round((this.handle?.progress ?? 0) * 100),
            estimatedMinutes: this.handle?.remainingMinutes ?? 0,
        });
    }

    private emitStatus() {
        if (this.abandoned) {
            return;
        }
        // A refresh runs the import in the background, exactly as v1 handles a routine event sync: no
        // status override, so no progress bar (v1 doesn't set `isRefreshing` for a normal sync). We
        // still forward v1's status verbatim so any real change during the import propagates.
        if (this.mode === 'refresh') {
            this.deps.updateESStatus(this.lastV1Status);
            return;
        }

        const running = this.phase !== 'done';
        // A fresh index keeps the progress UI visible until the *import* finishes (not just v1), then
        // flips to the done state.
        this.deps.updateESStatus(
            running
                ? { ...this.lastV1Status, isEnablingContentSearch: true, contentIndexingDone: false, esEnabled: false }
                : { ...this.lastV1Status, isEnablingContentSearch: false, contentIndexingDone: true, esEnabled: true }
        );
    }
}
