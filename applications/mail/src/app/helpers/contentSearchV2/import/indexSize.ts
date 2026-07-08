import { openESDB } from '@proton/encrypted-search/esIDB';

export async function findEncryptedSearchIndexSize(userId: string): Promise<number | undefined> {
    const db = await openESDB(userId);
    if (!db) {
        return undefined;
    }
    return db.transaction('metadata').store.count();
}
