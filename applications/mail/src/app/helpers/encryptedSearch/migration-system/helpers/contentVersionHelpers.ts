import type { IDBPDatabase } from 'idb';

import type { EncryptedSearchDB } from '@proton/encrypted-search/models';

import { getContentVersion } from '../../esBuild';
import { type ESItemCursorResult, READ_BATCH_SIZE } from '../interface';

export const isAllContentUpToDate = async (esDB: IDBPDatabase<EncryptedSearchDB>): Promise<boolean> => {
    const tx = esDB.transaction('content', 'readonly');
    const contentStore = tx.objectStore('content');
    const versionIndex = contentStore.index('byVersion');

    // Check if any content has version less than current (includes -1, 1, 2)
    const range = IDBKeyRange.upperBound(getContentVersion(), true);
    const cursor = await versionIndex.openKeyCursor(range);

    return cursor === null;
};

export async function readNextOudatedBatch(
    esDB: IDBPDatabase<EncryptedSearchDB>,
    batchSize = READ_BATCH_SIZE
): Promise<ESItemCursorResult[]> {
    const tx = esDB.transaction('content', 'readonly');
    const contentStore = tx.objectStore('content');
    const versionIndex = contentStore.index('byVersion');

    const range = IDBKeyRange.upperBound(getContentVersion(), true);
    let cursor = await versionIndex.openCursor(range);

    const batch: ESItemCursorResult[] = [];

    while (cursor && batch.length < batchSize) {
        batch.push({
            key: cursor.primaryKey,
            value: cursor.value,
        });
        cursor = await cursor.continue();
    }

    return batch;
}
