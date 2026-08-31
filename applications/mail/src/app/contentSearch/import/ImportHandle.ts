import * as Comlink from 'comlink';

import createListeners from '@proton/shared/lib/helpers/listeners';

import type { DatabaseLock } from '../db/DatabaseLock';
import { AsyncAbort } from '../utils/AsyncAbort';
import { type ImportIssue, ImportIssueSeverity, type ImportNotifications } from './Import';
import type ImportWorker from './ImportWorker';

/**
 * How an import run ended. `stopped` only happens because we asked it to (a pause, or a teardown),
 * so the caller that stopped it already knows what should happen next.
 */
export type ImportOutcome = 'completed' | 'stopped' | 'failed';

/** proxy class on main thread to report progress */
export class ImportHandle {
    public readonly onProgress = createListeners<[number]>();
    public readonly onIssue = createListeners<[ImportIssue[]]>();
    /**
     * Resolves once the run has ended, with what actually happened to it. Progress alone can't carry
     * that: a stopped or failed import is not a complete index, and reporting it as one is how a
     * partial index ends up presented as ready.
     */
    public readonly done: Promise<ImportOutcome>;

    private _issues: ImportIssue[] = [];
    private _startTime: number | undefined;
    private _completed: number = 0;
    /** indexing can happen in several runs when interrupted by search. we try our best to represent this as a single operation in terms of progress updates, so keep track of previous completed count */
    private _completedInPreviousRuns = 0;
    private _progress: number = 0;
    private _total: number | undefined = undefined;
    private importPromise?: Promise<void>;
    private _started = false;
    private stopAbortController = new AbortController();
    private resolveDone!: (outcome: ImportOutcome) => void;

    constructor(
        private readonly userId: string,
        private readonly keys: {
            indexV1Key: CryptoKey;
            indexV2Key: CryptoKey;
        },
        private readonly dbLock: DatabaseLock
    ) {
        this.done = new Promise((resolve) => {
            this.resolveDone = resolve;
        });
    }

    start(): Promise<void> {
        // can only run once
        if (this._started) {
            return Promise.resolve();
        }
        this._started = true;
        this._startTime = performance.now();
        const runPromise = this.dbLock.runIndexing(async (abortSignal) => {
            // note that this callback can run multiple times if indexing is interrupted by search
            const worker = new Worker(new URL('./import.worker.ts', import.meta.url));
            // allow aborting from the db lock signal, and also from stop()
            const asyncAbort = new AsyncAbort([abortSignal, this.stopAbortController.signal]);
            try {
                const wrappedWorker = Comlink.wrap<ImportWorker>(worker);
                const workerPromise = wrappedWorker.import(this.userId, this.keys, this.createProgressListener());
                await Promise.race([asyncAbort.promise, workerPromise]);
            } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    // don't forward the error from the stopAbortController
                    if (abortSignal.aborted) {
                        throw err;
                    }
                } else {
                    throw err;
                }
            } finally {
                worker.terminate();
                asyncAbort.dispose();
            }
        });

        this.importPromise = runPromise
            .then((): ImportOutcome => (this.stopAbortController.signal.aborted ? 'stopped' : 'completed'))
            .catch((err): ImportOutcome => {
                this._issues.push({ message: err.message, id: 'none', severity: ImportIssueSeverity.Fatal });
                this.onIssue.notify(this._issues);
                return 'failed';
            })
            .then((outcome) => {
                // this makes running return false, so it's important
                // to do this before emitting the events below!
                this.importPromise = undefined;
                // Only a completed run is at 100%. The others still emit a final tick — subscribers
                // watch progress to notice the run ended — but with the progress actually reached, so
                // nobody can mistake a partial index for a finished one.
                this.emitProgress(outcome === 'completed' ? 1 : this._progress);
                this.resolveDone(outcome);
            });
        return this.importPromise;
    }

    private createProgressListener(): ImportNotifications {
        return Comlink.proxy({
            onTotalAvailable: (total) => {
                this._completedInPreviousRuns += this._completed;
                this._completed = 0;
                this._total = total + this._completedInPreviousRuns;
            },
            onCompleted: (completed) => {
                this._completed = completed;
                if (typeof this._total === 'number') {
                    this.emitProgress(this.correctProgress(this.completed / this._total));
                }
            },
            onIssue: (issue) => {
                this._issues.push(issue);
                this.onIssue.notify(this._issues);
            },
        });
    }

    stop() {
        this.stopAbortController.abort();
    }

    get issues() {
        return this._issues;
    }

    get running() {
        return this.importPromise !== undefined;
    }

    get progress() {
        return this._progress;
    }

    /** Total number of items to import, once the worker has reported it (undefined until then). */
    get total(): number | undefined {
        return this._total;
    }

    get completed(): number {
        return this._completed + this._completedInPreviousRuns;
    }

    get remainingMinutes(): number | undefined {
        // No estimate until some progress has been made (avoids a divide-by-zero -> Infinity).
        if (this._startTime !== undefined && this._progress > 0) {
            const elapsed = performance.now() - this._startTime;
            const remaining = (elapsed / this._progress) * (1 - this._progress);
            return Math.ceil(remaining / (60 * 1000));
        }
    }
    /**
     * Indexing slows down as the index grows, so a linear message-count fraction badly
     * over-reports early progress. Per-item write cost grows ~linearly with the number
     * already indexed, making elapsed time quadratic in the message fraction:
     *
     *     t(p) ≈ a·p + b·p²   ⇒   f(p) = (p + r·p²) / (1 + r),  r = b/a
     *
     * Fit to a real ~34k-item run (timed [elapsedSeconds, rawFraction] samples up to
     * p≈0.48): a≈23, b≈1315 ⇒ r≈57, i.e. f(p) = (p + 57·p²) / 58, with f(0)=0, f(1)=1.
     * That extrapolates to a ~22min full run — the slowdown is heavily back-loaded.
     */
    private correctProgress(p: number): number {
        return (p + 57 * p * p) / 58;
    }

    private emitProgress(p: number) {
        this._progress = p;
        this.onProgress.notify(p);
    }
}
