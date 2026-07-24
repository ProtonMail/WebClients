import { hasESDB, openESDB } from '@proton/encrypted-search/esIDB';

export async function findEncryptedSearchIndexSize(userId: string): Promise<number | undefined> {
    // Never create the v1 ES DB: `openESDB` creates an empty shell if it's absent, which then makes
    // `hasESDB` report true and breaks v1's own enable flow. No index means no size to report.
    if (!(await hasESDB(userId))) {
        return undefined;
    }
    const db = await openESDB(userId);
    if (!db) {
        return undefined;
    }
    return db.transaction('metadata').store.count();
}
