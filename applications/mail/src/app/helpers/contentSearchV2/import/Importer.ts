import createListeners from '@proton/shared/lib/helpers/listeners';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys';

import type { ESBaseMessage } from 'proton-mail/models/encryptedSearch';

import { IndexWriter } from '../indexation/IndexWriter.ts';
import { initWasm } from '../indexation/init.ts';
import { EncryptedSearchReader } from './EncryptedSearchReader.ts';

export enum ImportIssueSeverity {
    Warning = 'Warning', // item was still imported
    Error = 'Error', // item was not imported
    Fatal = 'Fatal', // importation could not proceed
}

export interface ImportIssue {
    severity: ImportIssueSeverity;
    message: string;
    id: string | undefined;
}

// this is the main tuning knob for the size and amount of blobs
// we end up with in the new index, as the batch is written in one operation.
const BATCH_SIZE = 50;

export class Importer {
    public readonly onProgress = createListeners<[number]>();
    public readonly onIssue = createListeners<[ImportIssue[]]>();

    private abortController = new AbortController();
    private keyPassword: string;
    private user: UserModel;
    private _issues: ImportIssue[] = [];
    private _startTime: number | undefined;
    private _progress: number = 0;
    private _running = false;

    constructor(user: UserModel, keyPassword: string) {
        this.user = user;
        this.keyPassword = keyPassword;
    }

    get issues() {
        return this._issues;
    }

    get running() {
        return this._running;
    }

    get progress() {
        return this._progress;
    }

    get remainingMinutes(): number | undefined {
        // No estimate until some progress has been made (avoids a divide-by-zero -> Infinity).
        if (this._startTime !== undefined && this._progress > 0) {
            const elapsed = performance.now() - this._startTime;
            const remaining = (elapsed / this._progress) * (1 - this._progress);
            return Math.ceil(remaining / (60 * 1000));
        }
    }

    start() {
        if (this._running) {
            return;
        }
        this._running = true;
        this._startTime = performance.now();
        this.run()
            .catch((err) => this.handleError(err))
            .then(() => {
                this._running = false;
                this.emitProgress(1);
            })
            .catch((err) => this.handleError(err));
    }

    private async run() {
        const userKeys = await getDecryptedUserKeysHelper(this.user, this.keyPassword);
        this.abortController.signal.throwIfAborted();
        const oldStore = await EncryptedSearchReader.open(this.user.ID, userKeys);
        const totalMessageCount = await oldStore.getTotalMessageCount();
        if (typeof totalMessageCount !== 'number') {
            throw new Error('could not get total amount of messages in old index');
        }
        this.abortController.signal.throwIfAborted();
        await initWasm();
        this.abortController.signal.throwIfAborted();
        const newStore = await IndexWriter.open(this.user.ID, userKeys);
        try {
            await newStore.clear();
            let messages: { metadata: ESBaseMessage; body: string }[] | undefined;
            let total = 0;
            while (
                (messages = await oldStore.readNextBatch(
                    BATCH_SIZE,
                    (issue) => this.onReaderIssue(issue),
                    this.abortController.signal
                ))
            ) {
                await newStore.writeBatch(messages, this.abortController.signal);
                // foundation search never updates blobs (apart from the metadata one),
                // it only creates new ones. So it is important to regularly cleanup,
                // otherwise disk usage explodes during indexation.
                // (3gb without cleanup vs 37mb with cleanup for 34k e-mails account.)
                // this also happens to speed up indexation a lot.
                await newStore.cleanup(this.abortController.signal);
                total += messages.length;
                this.emitProgress(this.correctProgress(total / totalMessageCount));
            }
        } finally {
            newStore.close();
        }
    }

    private handleError(err: Error) {
        this._issues.push({ severity: ImportIssueSeverity.Fatal, message: err.message, id: undefined });
        this.onIssue.notify(this._issues);
    }

    private onReaderIssue(issue: ImportIssue) {
        this._issues.push(issue);
        this.onIssue.notify(this._issues);
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

    stop() {
        this.abortController.abort();
    }
}
