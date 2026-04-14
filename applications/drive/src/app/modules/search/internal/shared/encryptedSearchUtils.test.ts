import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { deleteLegacyEncryptedSearchDb, hasLegacyEncryptedSearchDb } from './encryptedSearchUtils';

describe('encryptedSearchUtils', () => {
    beforeEach(() => {
        indexedDB = new IDBFactory();
    });

    describe('hasLegacyEncryptedSearchDb', () => {
        it('returns false when no legacy DB exists', async () => {
            expect(await hasLegacyEncryptedSearchDb('user-1')).toBe(false);
        });

        it('returns true when a legacy DB exists for the user', async () => {
            // Create a legacy DB by opening it.
            const request = indexedDB.open('ES:user-1:DB', 1);
            await new Promise<void>((resolve) => {
                request.onsuccess = () => resolve();
            });

            expect(await hasLegacyEncryptedSearchDb('user-1')).toBe(true);
        });

        it('returns false for a different user', async () => {
            const request = indexedDB.open('ES:user-1:DB', 1);
            await new Promise<void>((resolve) => {
                request.onsuccess = () => resolve();
            });

            expect(await hasLegacyEncryptedSearchDb('user-2')).toBe(false);
        });

        it('returns false when indexedDB.databases() is unsupported', async () => {
            const original = indexedDB.databases;
            (indexedDB as any).databases = () => {
                throw new Error('not supported');
            };

            expect(await hasLegacyEncryptedSearchDb('user-1')).toBe(false);

            indexedDB.databases = original;
        });
    });

    describe('deleteLegacyEncryptedSearchDb', () => {
        it('deletes an existing legacy DB', async () => {
            const request = indexedDB.open('ES:user-1:DB', 1);
            const db = await new Promise<IDBDatabase>((resolve) => {
                request.onsuccess = () => resolve(request.result);
            });
            db.close();

            expect(await hasLegacyEncryptedSearchDb('user-1')).toBe(true);

            await deleteLegacyEncryptedSearchDb('user-1');

            expect(await hasLegacyEncryptedSearchDb('user-1')).toBe(false);
        });

        it('resolves without error when the DB does not exist', async () => {
            await expect(deleteLegacyEncryptedSearchDb('user-1')).resolves.toBeUndefined();
        });
    });
});
