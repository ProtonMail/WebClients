import * as Comlink from 'comlink';

import createListeners from '@proton/shared/lib/helpers/listeners';

import { type ImportIssue, ImportIssueSeverity } from './Import';
import type ImportWorker from './ImportWorker';

/** proxy class on main thread to report progress */
export class ImportHandle {
    public readonly onProgress = createListeners<[number]>();
    public readonly onIssue = createListeners<[ImportIssue[]]>();

    private _issues: ImportIssue[] = [];
    private _startTime: number | undefined;
    private _completed: number = 0;
    private _progress: number = 0;
    private _total: number | undefined;
    private importPromise?: Promise<void>;

    constructor(
        private readonly worker: Comlink.Remote<ImportWorker>,
        private readonly terminateWorker: () => void
    ) {}

    async start(
        userId: string,
        keys: {
            indexV1Key: CryptoKey;
            indexV2Key: CryptoKey;
        }
    ) {
        if (this.importPromise) {
            return;
        }
        this._startTime = performance.now();
        let total = Infinity;
        this.importPromise = this.worker.import(
            userId,
            keys,
            Comlink.proxy({
                onTotalAvailable: (_total) => {
                    total = _total;
                    this._total = _total;
                },
                onCompleted: (completed) => {
                    this._completed = completed;
                    this.emitProgress(this.correctProgress(completed / total));
                },
                onIssue: (issue) => {
                    this._issues.push(issue);
                    this.onIssue.notify(this._issues);
                },
            })
        );
        this.importPromise
            .finally(() => {
                this.terminateWorker();
                // this makes running return false, so it's important
                // to do this before emitting the last event below!
                this.importPromise = undefined;
                this.emitProgress(1);
            })
            .catch((err) => {
                this._issues.push({ message: err.message, id: 'none', severity: ImportIssueSeverity.Fatal });
                this.onIssue.notify(this._issues);
            });
    }

    stop() {
        this.terminateWorker();
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
        return this._completed;
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
