import type { SyncEventShareFolderOutput } from '../../../types';
import type { EventProcessor } from '../types';

/** FIXME: when adding folder support */
export function* processFoldersUpdated(updated: SyncEventShareFolderOutput[]): EventProcessor {
    if (updated.length === 0) return true;
    return true;
}

/** FIXME: when adding folder support */
export function* processFoldersDeleted(deleted: SyncEventShareFolderOutput[]): EventProcessor {
    if (deleted.length === 0) return true;
    return true;
}
