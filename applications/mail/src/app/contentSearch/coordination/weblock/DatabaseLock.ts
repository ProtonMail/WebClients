import type { DatabaseLock as DatabaseLockInterface } from '../../db/DatabaseLock';
import { isAbortedFrom } from '../../utils/AsyncAbort';
import type { Logger } from '../../utils/logger';

type IndexingOutcome = 'completed' | 'interrupted';

/**
 * What a request for a held lock rejects with when another request steals it. The callback of the stolen request
 * keeps running: stealing only takes the lock away from it.
 */
const isStolenLockError = (err: unknown) => {
    // a DOMException, which isn't an Error in every environment
    return typeof err === 'object' && err !== null && 'name' in err && err.name === 'AbortError';
};

/** The interrupt lock while a tab's searches hold it. */
interface InterruptHold {
    /** false once released, or stolen by a search in another tab */
    held: boolean;
    release: () => void;
}

/**
 * {@link DatabaseLockInterface} within one tab and across the tabs of one user, on two Web Locks:
 * - the interrupt lock: indexing holds it while it runs. A search steals it to make indexing unwind, and holds it
 *   until it's done so indexing can't start again;
 * - the access lock: exclusive for indexing, shared for searches, never stolen. Indexing takes the interrupt lock
 *   before the access lock, and releases the access lock only once it has unwound: that release lets the search in.
 */
export class DatabaseLock implements DatabaseLockInterface {
    private readonly interruptLockName: string;
    private readonly accessLockName: string;
    /** settles once the last search of this tab requested so far is done */
    private searchQueue: Promise<void> = Promise.resolve();
    private pendingSearches = 0;
    /** shared by back-to-back searches of this tab, so indexing doesn't run in between */
    private interruptHold: InterruptHold | undefined;

    constructor(
        userId: string,
        private readonly logger: Logger,
        // eslint-disable-next-line compat/compat -- content search requires Safari 15.4+
        private readonly locks: LockManager = navigator.locks
    ) {
        this.interruptLockName = `content-search:${userId}:interrupt`;
        this.accessLockName = `content-search:${userId}:access`;
    }

    async runSearch(callback: () => Promise<void>): Promise<void> {
        this.pendingSearches++;
        const previousSearch = this.searchQueue;
        let resolveSearchDone!: () => void;
        this.searchQueue = new Promise<void>((resolve) => {
            resolveSearchDone = resolve;
        });
        try {
            await previousSearch;
            await this.holdInterruptLock();
            await this.locks.request(this.accessLockName, { mode: 'shared' }, () => {
                return callback();
            });
        } finally {
            this.pendingSearches--;
            if (this.pendingSearches === 0) {
                this.interruptHold?.release();
                this.interruptHold = undefined;
            }
            resolveSearchDone();
        }
    }

    /** Steals the interrupt lock, unless this tab's searches still hold it. */
    private async holdInterruptLock() {
        if (this.interruptHold?.held) {
            return;
        }
        this.interruptHold?.release();
        let release!: () => void;
        const released = new Promise<void>((resolve) => {
            release = resolve;
        });
        const hold: InterruptHold = { held: false, release };
        this.interruptHold = hold;
        await new Promise<void>((granted) => {
            this.locks
                .request(this.interruptLockName, { steal: true }, () => {
                    hold.held = true;
                    granted();
                    return released;
                })
                // rejects when a search in another tab steals it in turn: that search keeps indexing out now
                .catch(() => {})
                .finally(() => {
                    hold.held = false;
                });
        });
    }

    /** can be interrupted by search so might run several times before it can complete */
    async runIndexing(callback: (signal: AbortSignal) => Promise<void>): Promise<void> {
        let outcome = await this.runIndexingOnce(callback, false);
        while (outcome === 'interrupted') {
            outcome = await this.runIndexingOnce(callback, true);
        }
    }

    /**
     * Holds the interrupt lock, then the access lock, while indexing runs. A search steals the interrupt lock to
     * interrupt it: indexing then unwinds, and releases the access lock, which lets the search in.
     */
    private async runIndexingOnce(
        callback: (signal: AbortSignal) => Promise<void>,
        afterInterruption: boolean
    ): Promise<IndexingOutcome> {
        const interruption = new AbortController();
        let indexing: Promise<IndexingOutcome> | undefined;
        const interruptLock = this.locks.request(this.interruptLockName, async () => {
            indexing = this.runWithAccessLock(callback, interruption.signal, afterInterruption);
            // indexing reports its own outcome below: the request for the interrupt lock rejects only when stolen
            await indexing.catch(() => {});
        });
        try {
            await interruptLock;
        } catch (err) {
            if (!isStolenLockError(err)) {
                throw err;
            }
            // a search stole the interrupt lock: interrupt indexing, which keeps the access lock until it has unwound
            this.logger.info('indexing interrupted by a search, in this tab or another');
            interruption.abort();
        }
        if (!indexing) {
            throw new Error('the interrupt lock was released before it was granted');
        }
        return indexing;
    }

    /** Rejects only when indexing fails, as being interrupted is an outcome. */
    private async runWithAccessLock(
        callback: (signal: AbortSignal) => Promise<void>,
        interruptSignal: AbortSignal,
        afterInterruption: boolean
    ): Promise<IndexingOutcome> {
        try {
            // interrupted while waiting, the request rejects with the signal's reason
            await this.locks.request(this.accessLockName, { signal: interruptSignal }, async () => {
                // interrupted as the lock was granted
                if (interruptSignal.aborted) {
                    throw interruptSignal.reason;
                }
                if (afterInterruption) {
                    this.logger.info('indexing resumes, the searches that interrupted it are done');
                }
                await callback(interruptSignal);
            });
            return 'completed';
        } catch (err) {
            if (isAbortedFrom(err, interruptSignal)) {
                return 'interrupted';
            }
            throw err;
        }
    }
}
