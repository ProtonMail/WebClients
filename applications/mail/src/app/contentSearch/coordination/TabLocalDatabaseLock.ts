import type { DatabaseLock } from '../db/DatabaseLock';
import { isAbortedFrom } from '../utils/AsyncAbort';

/** {@link DatabaseLock} within one tab only */
export class TabLocalDatabaseLock implements DatabaseLock {
    private indexingAbortController: AbortController | undefined;
    private searchPromise: Promise<void> | undefined;
    private resolveIndexingFinished: (() => void) | undefined;

    async runSearch(callback: () => Promise<void>) {
        let resolve: () => void | undefined;
        // promise needs to be present when indexing receives abort signal,
        // so we create one ourselves
        const previousSearchPromise = this.searchPromise;
        const searchPromise = new Promise<void>((r) => (resolve = r));
        this.searchPromise = searchPromise;
        await previousSearchPromise;
        try {
            if (this.indexingAbortController) {
                // wait until the indexing confirms the abort,
                // as it might be awaiting something async
                await new Promise<void>((r) => {
                    this.resolveIndexingFinished = r;
                    this.indexingAbortController?.abort();
                });
                this.resolveIndexingFinished = undefined;
            }
            await callback();
        } finally {
            if (this.searchPromise === searchPromise) {
                this.searchPromise = undefined;
            }
            resolve!();
        }
    }

    async runIndexing(callback: (signal: AbortSignal) => Promise<void>) {
        let interrupted = false;
        do {
            // search promise could be replaced for consecutive searches
            while (this.searchPromise) {
                await this.searchPromise;
            }
            interrupted = false;
            this.indexingAbortController = new AbortController();
            try {
                await callback(this.indexingAbortController.signal);
            } catch (err) {
                if (isAbortedFrom(err, this.indexingAbortController.signal)) {
                    interrupted = true;
                } else {
                    throw err;
                }
            } finally {
                this.indexingAbortController = undefined;
                // let the search know we've received the abort
                // and are not touching the db anymore
                this.resolveIndexingFinished?.();
            }
        } while (interrupted);
    }
}
