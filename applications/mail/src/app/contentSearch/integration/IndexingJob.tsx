import type { ESIndexingState, ESTimepoint } from '@proton/encrypted-search/models';

import type { ImportHandle, ImportOutcome } from '../import/ImportHandle';
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
    /**
     * Called once the job has ended, so the adapter can drop its reference to it and decide what a
     * failed import means for where searches are answered.
     */
    onFinished: (outcome: ImportOutcome) => void;
}

export class IndexingJob {
    private phase: 'v1' | 'v1-sync' | 'import' | 'import-paused' | 'done';
    private lastV1Status: ESStatusConcrete;
    private handle?: ImportHandle;
    private unsubscribe?: () => void;
    private abandoned = false;
    /** How the import ended; only set once `phase` is `done`. */
    private outcome?: ImportOutcome;

    constructor(
        private readonly deps: JobDeps,
        public readonly mode: JobMode
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

    /**
     * Pause the v2 import, if that is what's currently running. Returns whether the job took care of
     * the pause: from the handoff onwards v1 has nothing left to pause and must not be told to — its
     * `pauseContentIndexing` would rewrite the `ACTIVE` progress row it just wrote to `PAUSED`, so a
     * completed v1 index would come back as paused on the next startup.
     */
    pauseImport(): boolean {
        if (this.abandoned || this.mode !== 'index' || this.phase !== 'import') {
            return false;
        }
        this.phase = 'import-paused';
        // The handle is kept, so its `done` (resolving `stopped`) is recognised as this pause rather
        // than as an ending the job has to report.
        this.handle?.stop();
        this.emitStatus();
        return true;
    }

    /** Counterpart of {@link pauseImport}: restart the import, which resumes where it left off. */
    resumeImport(): boolean {
        if (this.abandoned || this.phase !== 'import-paused') {
            return false;
        }
        this.startImport();
        return true;
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
                this.finish('failed');
            });
    }

    private startImport() {
        this.unsubscribe?.();
        this.unsubscribe = undefined;
        this.handle = undefined;
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
                    this.finish('completed');
                    return;
                }
                this.handle = handle;
                this.unsubscribe = handle.onProgress.subscribe(() => {
                    if (this.abandoned) {
                        return;
                    }
                    this.emitImportProgress();
                });
                // The outcome, not the progress, is what ends the job: progress reaching its end says
                // nothing about whether the index is complete. `done` also resolves for a run that
                // ended before we got here, so there's no replay gap to catch up on.
                void handle.done.then((outcome) => {
                    // Ignore a handle we've moved on from — paused and then resumed with a new one.
                    if (this.abandoned || this.handle !== handle) {
                        return;
                    }
                    if (outcome === 'stopped') {
                        if (this.phase === 'import-paused') {
                            // Our own pause — it has already decided what the status should be.
                            return;
                        }
                        // Stopped from outside the job: the debug dialog shares the import handle (see
                        // `useImporter`), so its Cancel lands here.
                        if (this.mode === 'refresh') {
                            // A refresh has no pause UI and no resume verb, so it can only end. That's
                            // also what lets the next event refresh again — the adapter won't start a job
                            // while this one is alive. Nothing is lost: the ids still to import stay in
                            // `outdated_import_ids` (each is only dropped once its batch is written).
                            this.finish('stopped');
                            return;
                        }
                        // A fresh index, on the other hand, is exactly in the situation a pause leaves it
                        // in — resumable, with the bar still up.
                        this.phase = 'import-paused';
                        this.emitStatus();
                        return;
                    }
                    this.finish(outcome);
                });
            })
            .catch((err) => {
                // The import failed to even start (e.g. key derivation / worker setup threw). Terminate
                // so the status clears instead of hanging on "updating"/"enabling" indefinitely.
                console.error(err);
                this.finish('failed');
            });
    }

    private finish(outcome: ImportOutcome) {
        if (this.phase === 'done' || this.abandoned) {
            return;
        }
        this.phase = 'done';
        this.outcome = outcome;
        this.emitStatus();
        this.emitImportProgress();
        this.deps.onFinished(outcome);
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

        // Only a completed import may report a finished index. Anything else leaves the v2 index
        // partial, and the adapter answers searches from the server rather than from it (see
        // `ESAdapter.isV2IndexUsable`), so content search is reported as not indexed — v1's own
        // `contentIndexingDone` would claim a searchable index the user isn't getting, and that's the
        // transition `useContentSearchReadyNotification` announces on. `esEnabled` is deliberately not
        // written here, so whatever the user's toggle says by then, including a change made during the
        // job, is what comes through.
        if (this.phase === 'done') {
            this.deps.updateESStatus(
                this.outcome === 'completed'
                    ? { ...this.lastV1Status, isEnablingContentSearch: false, contentIndexingDone: true }
                    : { ...this.lastV1Status, isEnablingContentSearch: false, contentIndexingDone: false }
            );
            return;
        }

        // A fresh index keeps the progress UI up until the *import* finishes, not just v1, and reports
        // content search as off for as long as it runs: the index can't answer a search yet, so queries
        // go to the server (`isES` is false, see `elementsSelectors`). `esEnabled` is only held down
        // while the job runs — the done branch above never writes it, so whatever the user's toggle says
        // by then, including a change made during the job, is what comes through.
        // A pause is likewise only ours to report once we own the running phase; during v1's own phase
        // v1 reports it itself.
        const pausedByUs = this.phase === 'import-paused';
        this.deps.updateESStatus({
            ...this.lastV1Status,
            isEnablingContentSearch: !pausedByUs && !this.lastV1Status.isContentIndexingPaused,
            isContentIndexingPaused: pausedByUs || this.lastV1Status.isContentIndexingPaused,
            contentIndexingDone: false,
            esEnabled: false,
        });
    }
}
