/**
 * Utility to handle IndexedDB version downgrades by detecting version mismatches
 * and automatically deleting and recreating the database.
 */

export const getIndexedDBVersion = async (dbName: string): Promise<number | null> => {
    return new Promise((resolve) => {
        try {
            const request = indexedDB.open(dbName);
            let isNew = false;

            request.onupgradeneeded = () => { isNew = true; };
            
            request.onsuccess = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                const version = db.version;
                db.close();
                
                if (isNew) {
                    indexedDB.deleteDatabase(dbName);
                    resolve(null);
                } else {
                    resolve(version);
                }
            };

            request.onerror = request.onblocked = () => resolve(null);
        } catch {
            resolve(null);
        }
    });
};

export const deleteIndexedDB = async (dbName: string): Promise<boolean> => {
    return new Promise((resolve) => {
        try {
            const request = indexedDB.deleteDatabase(dbName);
            request.onsuccess = () => {
                console.log(`[IndexedDB] Successfully deleted database: ${dbName}`);
                resolve(true);
            };
            request.onerror = request.onblocked = () => resolve(false);
        } catch {
            console.error(
                `[IndexedDB] Failed to delete database ${dbName}. ` +
                    `Application may not function correctly.`
            );
            resolve(false);
        }
    });
};

export const handleIndexedDBVersionDowngrade = async (
    dbName: string,
    requestedVersion: number
): Promise<boolean> => {
    try {
        const currentVersion = await getIndexedDBVersion(dbName);
        
        if (currentVersion !== null && currentVersion > requestedVersion) {
            console.warn(
                `[IndexedDB] Version downgrade detected for ${dbName}: ` +
                    `current=${currentVersion}, requested=${requestedVersion}. ` +
                    `Deleting database to allow recreation.`
            );

            return await deleteIndexedDB(dbName);
        }
        
        return false;
    } catch {
        return false;
    }
};