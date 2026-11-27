import type { IDBPDatabase } from 'idb';

import type { Database } from '../../../db/schema';
import type { EventUpdate, EventUpdateWriter } from '../EventUpdateWriter';
import type { IndexTask, TaskName } from '../IndexWorker';
import type { IndexWrites } from '../IndexWrites';

export class IncrementalIndexer implements IndexTask {
    private queue: EventUpdate[] = [];

    constructor(private readonly writer: EventUpdateWriter) {}

    get name(): TaskName {
        return 'incremental';
    }

    async needsRun() {
        return this.queue.length !== 0;
    }

    async run(db: IDBPDatabase<Database>, writes: IndexWrites, abortSignal: AbortSignal) {
        while (this.queue.length !== 0) {
            const next = this.queue[0];
            await this.writer.apply(db, writes, next, abortSignal);
            this.queue.shift(); // remove the first element
        }
    }

    pushUpdate(update: EventUpdate) {
        this.queue.push(update);
    }
}
