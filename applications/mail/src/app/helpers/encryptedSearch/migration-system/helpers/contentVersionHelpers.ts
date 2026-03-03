import type { IDBPDatabase } from 'idb';

import type { EncryptedSearchDB } from '@proton/encrypted-search/models';

import { getContentVersion } from '../../esBuild';
import type { ESItemCursorResult } from '../interface';

export const isAllContentUpToDate = async (esDB: IDBPDatabase<EncryptedSearchDB>): Promise<boolean> => {
    const tx = esDB.transaction('content', 'readonly');
    const contentStore = tx.objectStore('content');
    const versionIndex = contentStore.index('version');

    // Check if any content has version less than current (includes -1, 1, 2)
    const range = IDBKeyRange.upperBound(getContentVersion() - 1, false);
    const cursor = await versionIndex.openKeyCursor(range);

    return cursor === null;
};

export async function* getOutdatedContentIterator(
    esDB: IDBPDatabase<EncryptedSearchDB>
): AsyncIterableIterator<ESItemCursorResult> {
    const tx = esDB.transaction('content', 'readonly');
    const contentStore = tx.objectStore('content');
    const versionIndex = contentStore.index('version');

    // Range to find all content with version less than current
    const range = IDBKeyRange.upperBound(getContentVersion() - 1, false);
    let cursor = await versionIndex.openCursor(range);

    // Collect all entries while the transaction is still active.
    const entries: ESItemCursorResult[] = [];

    while (cursor) {
        entries.push({
            key: cursor.primaryKey,
            value: cursor.value,
        });
        cursor = await cursor.continue();
    }

    for (const entry of entries) {
        yield entry;
    }
}
