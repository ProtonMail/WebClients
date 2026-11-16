import type { IDBPDatabase } from 'idb';

import type { Database } from '../../../db/schema';
import { ExponentialBackoff } from '../../../utils/ExponentialBackoff';
import type { StartBlobTxnFn } from '../BlobTxnProvider';
import type { EventUpdateWriter } from '../EventUpdateWriter';
import type { IndexApi } from '../IndexApi';
import type { IndexTask, TaskName } from '../IndexWorker';

const STALE_RETRY_INITIAL_DELAY_MS = 1000;
const STALE_RETRY_MAX_DELAY_MS = 30_000;

/**
 * Replays the events from the stored event cursor up to the latest one, so changes made while the app
 * was closed reach the index.
 *
 * Each event is committed together with its id as the new cursor, so an aborted run resumes from the last
 * committed event.
 *
 * When the server can't read past the cursor yet (its replica is lagging), it answers with the cursor itself
 * and More set, asking to retry. Catch-up then retries with an exponential backoff rather than giving up:
 * a live update would move the cursor past the events it hasn't replayed.
 */
export class CatchupIndexer implements IndexTask {
    private runRequested = false;

    constructor(
        private readonly api: IndexApi,
        private readonly writer: EventUpdateWriter,
        private readonly staleRetryBackoff: ExponentialBackoff = new ExponentialBackoff(
            STALE_RETRY_INITIAL_DELAY_MS,
            STALE_RETRY_MAX_DELAY_MS
        )
    ) {}

    get name(): TaskName {
        return 'catchup';
    }

    requestRun() {
        this.runRequested = true;
    }

    async needsRun(db: IDBPDatabase<Database>) {
        // historic indexing hasn't committed anything yet, it stores the latest event itself when it does
        if (this.runRequested && !(await this.readCursor(db))) {
            this.runRequested = false;
        }
        return this.runRequested;
    }

    async run(db: IDBPDatabase<Database>, startBlobTxn: StartBlobTxnFn, abortSignal: AbortSignal) {
        this.staleRetryBackoff.reset();
        while (this.runRequested) {
            abortSignal.throwIfAborted();
            const cursor = await this.readCursor(db);
            if (!cursor) {
                this.runRequested = false;
                return;
            }
            const response = await this.api.fetchEventUpdate(cursor, abortSignal);
            if (!response.refresh && response.more && response.eventID === cursor) {
                await this.staleRetryBackoff.wait(abortSignal);
                continue;
            }
            this.staleRetryBackoff.reset();
            await this.writer.apply(db, startBlobTxn, response, abortSignal);
            // the response covers every event up to the latest one at the time of the request,
            // later ones reach the incremental indexer through the live event loop.
            // A refresh can have more, but resetting the index clears the cursor, which ends the loop above.
            if (!response.more) {
                this.runRequested = false;
                return;
            }
        }
    }

    private async readCursor(db: IDBPDatabase<Database>) {
        return (await db.get('event_cursor', 'event_cursor'))?.eventID;
    }
}
