import { Logger } from '../../../../shared/Logger';
import type { TaskContext } from '../BaseTask';
import { BaseTask } from '../BaseTask';

// Remove blobs from IndexedDB that are no longer referenced by any engine using the
// CleanUp API from search library.
export class CleanUpStaleBlobsTask extends BaseTask {
    getUid(): string {
        return 'task-CleanUpStaleBlobs';
    }

    async execute(_ctx: TaskContext): Promise<void> {
        // TODO: Implement
        // TODO: Remove orphan blobs in case any exceptions happen in the middle of save operations.
        // When saving, we save blobs to IndexedDB but only the last save updates the manifest and updates
        // the revision to make the saved blobs available. If anything happens before the manifest update,
        // we leak some blobs. Check tracked blobs from the clean up event to remove those potentially orphaned
        // blobs when it's added to the search library.
        // https://protonag.atlassian.net/browse/FOUN-396

        Logger.info(`Running: ${this.getUid()}`);
    }
}
