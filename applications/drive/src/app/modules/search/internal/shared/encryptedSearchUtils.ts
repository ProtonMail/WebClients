// Utilities for manipulating the legacy encrypted-search IndexedDB.
// Duplicated from the legacy package so we can remove that dependency.

const legacyDbName = (userId: string) => `ES:${userId}:DB`;

/**
 * Check whether a legacy encrypted-search IndexedDB exists for the user.
 *
 */
export async function hasLegacyEncryptedSearchDb(userId: string): Promise<boolean> {
    try {
        // indexedDB.databases() is unsupported on Firefox < 126.
        const databases = await indexedDB.databases();
        return databases.some(({ name }) => name === legacyDbName(userId));
    } catch {
        return false;
    }
}

export async function deleteLegacyEncryptedSearchDb(userId: string): Promise<void> {
    const dbName = legacyDbName(userId);
    return new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(dbName);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
