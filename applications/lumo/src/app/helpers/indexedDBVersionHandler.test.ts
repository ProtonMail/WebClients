import {
    deleteIndexedDB,
    getIndexedDBVersion,
    handleIndexedDBVersionDowngrade,
} from './indexedDBVersionHandler';

describe('indexedDBVersionHandler', () => {
    const TEST_DB_NAME = 'test-version-handler-db';

    // Suppress console output during tests for cleaner output
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'warn').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    // Clean up any test databases after each test
    afterEach(async () => {
        await deleteIndexedDB(TEST_DB_NAME);
    });

    describe('getIndexedDBVersion', () => {
        it('should return null for non-existent database', async () => {
            const version = await getIndexedDBVersion('non-existent-db-12345');
            expect(version).toBeNull();
        });

        it('should return the correct version for an existing database', async () => {
            // Create a database with version 5
            const request = indexedDB.open(TEST_DB_NAME, 5);
            await new Promise<void>((resolve) => {
                request.onsuccess = () => {
                    request.result.close();
                    resolve();
                };
            });

            const version = await getIndexedDBVersion(TEST_DB_NAME);
            expect(version).toBe(5);
        });

        it('should return version 1 for database created without explicit version', async () => {
            // Create a database without specifying version (defaults to 1)
            const request = indexedDB.open(TEST_DB_NAME);
            await new Promise<void>((resolve) => {
                request.onsuccess = () => {
                    request.result.close();
                    resolve();
                };
            });

            const version = await getIndexedDBVersion(TEST_DB_NAME);
            expect(version).toBe(1);
        });
    });

    describe('deleteIndexedDB', () => {
        it('should successfully delete an existing database', async () => {
            // Create a database
            const request = indexedDB.open(TEST_DB_NAME, 3);
            await new Promise<void>((resolve) => {
                request.onsuccess = () => {
                    request.result.close();
                    resolve();
                };
            });

            // Verify it exists
            let version = await getIndexedDBVersion(TEST_DB_NAME);
            expect(version).toBe(3);

            // Delete it
            const deleted = await deleteIndexedDB(TEST_DB_NAME);
            expect(deleted).toBe(true);

            // Verify it's gone
            version = await getIndexedDBVersion(TEST_DB_NAME);
            expect(version).toBeNull();
        });

        it('should return true even when deleting non-existent database', async () => {
            const deleted = await deleteIndexedDB('non-existent-db-67890');
            expect(deleted).toBe(true);
        });

        it('should handle multiple delete calls gracefully', async () => {
            // Create a database
            const request = indexedDB.open(TEST_DB_NAME, 2);
            await new Promise<void>((resolve) => {
                request.onsuccess = () => {
                    request.result.close();
                    resolve();
                };
            });

            // Delete it multiple times
            const deleted1 = await deleteIndexedDB(TEST_DB_NAME);
            const deleted2 = await deleteIndexedDB(TEST_DB_NAME);
            const deleted3 = await deleteIndexedDB(TEST_DB_NAME);

            expect(deleted1).toBe(true);
            expect(deleted2).toBe(true);
            expect(deleted3).toBe(true);
        });
    });

    describe('handleIndexedDBVersionDowngrade', () => {
        it('should return false when database does not exist', async () => {
            const wasDeleted = await handleIndexedDBVersionDowngrade('non-existent-db-11111', 5);
            expect(wasDeleted).toBe(false);
        });

        it('should return false when current version equals requested version', async () => {
            // Create database with version 7
            const request = indexedDB.open(TEST_DB_NAME, 7);
            await new Promise<void>((resolve) => {
                request.onsuccess = () => {
                    request.result.close();
                    resolve();
                };
            });

            // Request version 7 (same as current)
            const wasDeleted = await handleIndexedDBVersionDowngrade(TEST_DB_NAME, 7);
            expect(wasDeleted).toBe(false);

            // Verify database still exists
            const version = await getIndexedDBVersion(TEST_DB_NAME);
            expect(version).toBe(7);
        });

        it('should return false when current version is lower than requested version (normal upgrade)', async () => {
            // Create database with version 5
            const request = indexedDB.open(TEST_DB_NAME, 5);
            await new Promise<void>((resolve) => {
                request.onsuccess = () => {
                    request.result.close();
                    resolve();
                };
            });

            // Request version 8 (upgrade scenario)
            const wasDeleted = await handleIndexedDBVersionDowngrade(TEST_DB_NAME, 8);
            expect(wasDeleted).toBe(false);

            // Verify database still exists with original version
            const version = await getIndexedDBVersion(TEST_DB_NAME);
            expect(version).toBe(5);
        });

        it('should delete database and return true when current version is higher than requested (downgrade)', async () => {
            // Create database with version 10
            const request = indexedDB.open(TEST_DB_NAME, 10);
            await new Promise<void>((resolve) => {
                request.onsuccess = () => {
                    request.result.close();
                    resolve();
                };
            });

            // Verify it exists
            let version = await getIndexedDBVersion(TEST_DB_NAME);
            expect(version).toBe(10);

            // Request version 7 (downgrade scenario)
            const wasDeleted = await handleIndexedDBVersionDowngrade(TEST_DB_NAME, 7);
            expect(wasDeleted).toBe(true);

            // Verify database was deleted
            version = await getIndexedDBVersion(TEST_DB_NAME);
            expect(version).toBeNull();
        });

        it('should handle downgrade from version 10 to version 1', async () => {
            // Create database with version 10
            const request = indexedDB.open(TEST_DB_NAME, 10);
            await new Promise<void>((resolve) => {
                request.onsuccess = () => {
                    request.result.close();
                    resolve();
                };
            });

            // Request version 1 (major downgrade)
            const wasDeleted = await handleIndexedDBVersionDowngrade(TEST_DB_NAME, 1);
            expect(wasDeleted).toBe(true);

            // Verify database was deleted
            const version = await getIndexedDBVersion(TEST_DB_NAME);
            expect(version).toBeNull();
        });

        it('should allow recreation after downgrade deletion', async () => {
            // Create database with version 8
            let request = indexedDB.open(TEST_DB_NAME, 8);
            await new Promise<void>((resolve) => {
                request.onsuccess = () => {
                    request.result.close();
                    resolve();
                };
            });

            // Trigger downgrade (version 8 -> 5)
            const wasDeleted = await handleIndexedDBVersionDowngrade(TEST_DB_NAME, 5);
            expect(wasDeleted).toBe(true);

            // Now create database with the lower version
            request = indexedDB.open(TEST_DB_NAME, 5);
            await new Promise<void>((resolve) => {
                request.onsuccess = () => {
                    request.result.close();
                    resolve();
                };
            });

            // Verify new database exists with correct version
            const version = await getIndexedDBVersion(TEST_DB_NAME);
            expect(version).toBe(5);
        });
    });

    describe('Integration scenarios', () => {
        it('should handle complete upgrade-downgrade-upgrade cycle', async () => {
            // Initial creation at version 5
            let request = indexedDB.open(TEST_DB_NAME, 5);
            await new Promise<void>((resolve) => {
                request.onsuccess = () => {
                    request.result.close();
                    resolve();
                };
            });

            let version = await getIndexedDBVersion(TEST_DB_NAME);
            expect(version).toBe(5);

            // Upgrade to version 8
            await handleIndexedDBVersionDowngrade(TEST_DB_NAME, 8);
            request = indexedDB.open(TEST_DB_NAME, 8);
            await new Promise<void>((resolve) => {
                request.onsuccess = () => {
                    request.result.close();
                    resolve();
                };
            });

            version = await getIndexedDBVersion(TEST_DB_NAME);
            expect(version).toBe(8);

            // Downgrade to version 6 (should delete)
            const wasDeleted = await handleIndexedDBVersionDowngrade(TEST_DB_NAME, 6);
            expect(wasDeleted).toBe(true);

            version = await getIndexedDBVersion(TEST_DB_NAME);
            expect(version).toBeNull();

            // Recreate at version 6
            request = indexedDB.open(TEST_DB_NAME, 6);
            await new Promise<void>((resolve) => {
                request.onsuccess = () => {
                    request.result.close();
                    resolve();
                };
            });

            version = await getIndexedDBVersion(TEST_DB_NAME);
            expect(version).toBe(6);

            // Upgrade to version 10
            await handleIndexedDBVersionDowngrade(TEST_DB_NAME, 10);
            request = indexedDB.open(TEST_DB_NAME, 10);
            await new Promise<void>((resolve) => {
                request.onsuccess = () => {
                    request.result.close();
                    resolve();
                };
            });

            version = await getIndexedDBVersion(TEST_DB_NAME);
            expect(version).toBe(10);
        });

        it('should preserve data during normal upgrades but lose it on downgrades', async () => {
            // Create database with version 5 and add some data
            let request = indexedDB.open(TEST_DB_NAME, 5);
            await new Promise<void>((resolve) => {
                request.onupgradeneeded = (event) => {
                    const db = (event.target as IDBOpenDBRequest).result;
                    const store = db.createObjectStore('testStore', { keyPath: 'id' });
                    store.put({ id: 1, data: 'test data' });
                };
                request.onsuccess = () => {
                    request.result.close();
                    resolve();
                };
            });

            // Upgrade to version 6 (data should be preserved)
            await handleIndexedDBVersionDowngrade(TEST_DB_NAME, 6);
            request = indexedDB.open(TEST_DB_NAME, 6);
            let hasData = await new Promise<boolean>((resolve) => {
                request.onsuccess = () => {
                    const db = request.result;
                    const tx = db.transaction('testStore', 'readonly');
                    const getRequest = tx.objectStore('testStore').get(1);
                    getRequest.onsuccess = () => {
                        db.close();
                        resolve(!!getRequest.result);
                    };
                };
            });
            expect(hasData).toBe(true);

            // Downgrade to version 4 (should delete database and lose data)
            const wasDeleted = await handleIndexedDBVersionDowngrade(TEST_DB_NAME, 4);
            expect(wasDeleted).toBe(true);

            // Recreate at version 4 - data should be gone
            request = indexedDB.open(TEST_DB_NAME, 4);
            hasData = await new Promise<boolean>((resolve) => {
                request.onupgradeneeded = (event) => {
                    const db = (event.target as IDBOpenDBRequest).result;
                    db.createObjectStore('testStore', { keyPath: 'id' });
                };
                request.onsuccess = () => {
                    const db = request.result;
                    const tx = db.transaction('testStore', 'readonly');
                    const getRequest = tx.objectStore('testStore').get(1);
                    getRequest.onsuccess = () => {
                        db.close();
                        resolve(!!getRequest.result);
                    };
                };
            });
            expect(hasData).toBe(false);
        });
    });

    describe('Error handling', () => {
        it('should handle errors gracefully and return false', async () => {
            // This shouldn't throw even with edge cases
            const result = await handleIndexedDBVersionDowngrade('', 5);
            expect(typeof result).toBe('boolean');
        });
    });
});
