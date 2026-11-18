import { readEnabled } from '@proton/encrypted-search/esIDB/configObjectStore';
import { hasESDB } from '@proton/encrypted-search/esIDB/indexedDB';

import { deleteContentSearchDB } from '../db/delete';
import { openContentSearchDB } from '../db/open';
import type { Logger } from '../utils/logger';

/**
 * Which path built the v2 database: importing v1's index (`ContentSearchIndexation` off) or indexing
 * the mailbox itself (on). Only the indexation path writes a status, and only the import path leaves
 * data without one.
 */
type IndexOrigin = 'none' | 'import' | 'indexation';

async function readIndexOrigin(userId: string): Promise<IndexOrigin> {
    const db = await openContentSearchDB(userId);
    try {
        const txn = db.transaction(['config', 'index_blobs', 'outdated_import_ids'], 'readonly');
        const config = txn.objectStore('config');
        const [status, indexKey, blobCount, outdatedCount] = await Promise.all([
            config.get('status'),
            config.get('indexKey'),
            txn.objectStore('index_blobs').count(),
            txn.objectStore('outdated_import_ids').count(),
        ]);
        if (status !== undefined) {
            return 'indexation';
        }
        if (indexKey !== undefined || blobCount > 0 || outdatedCount > 0) {
            return 'import';
        }
        return 'none';
    } finally {
        db.close();
    }
}

/** Without a v1 DB, `readEnabled` would create an empty one through `openESDB`. */
async function isV1Enabled(userId: string): Promise<boolean> {
    if (!(await hasESDB(userId))) {
        return false;
    }
    return (await readEnabled(userId)) === true;
}

async function writeEnabledStatus(userId: string) {
    const db = await openContentSearchDB(userId);
    try {
        await db.put('config', 'enabled', 'status');
    } finally {
        db.close();
    }
}

/**
 * Neither path can use the database the other one built, so switching `ContentSearchIndexation` drops it,
 * see `IndexService.resetDbBetweenFeatureFlagSwitches`. For the indexation path: drops an imported index and, when v1 search is enabled, enables the indexer,
 * which rebuilds the index from scratch. Leaves the in-memory status of `IndexService` alone, it reads the
 * status written here when it initializes.
 */
export async function dropImportedIndex(userId: string, logger: Logger) {
    if ((await readIndexOrigin(userId)) !== 'import') {
        return;
    }
    const shouldEnable = await isV1Enabled(userId);
    logger.info(`dropping the imported index, enabling the indexer: ${shouldEnable}`);
    await deleteContentSearchDB(userId);
    if (shouldEnable) {
        await writeEnabledStatus(userId);
    }
}

/** For the import path: drops an index built by the indexer, so the next import rebuilds it from v1. */
export async function dropIndexationIndex(userId: string, logger: Logger) {
    if ((await readIndexOrigin(userId)) !== 'indexation') {
        return;
    }
    logger.info('dropping the index built by the indexer');
    await deleteContentSearchDB(userId);
}
