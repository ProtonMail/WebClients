import * as db from 'proton-pass-web/lib/database';
import { getSessionKey } from 'proton-pass-web/lib/sessions';
import {
    B2B_STORAGE_KEY,
    TELEMETRY_STORAGE_KEY,
    getB2BEventsStorageKey,
    getSettingsStorageKey,
    getTelemetryStorageKey,
    localGarbageCollect,
} from 'proton-pass-web/lib/storage';

import type { EncryptedAuthSession } from '@proton/pass/lib/auth/session';

import { clearUserLocalData } from './storage';

describe('storage', () => {
    const removeItem = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation();
    const deletePassDB = jest.spyOn(db, 'deletePassDB').mockImplementation(async () => {});
    const getPassDBs = jest.spyOn(db, 'getPassDBs').mockImplementation(async () => []);

    beforeEach(() => {
        removeItem.mockClear();
        deletePassDB.mockClear();
        getPassDBs.mockClear();
    });

    describe('`clearUserLocalData`', () => {
        test('removes all user-specific data from localStorage', () => {
            const localID = 123;
            clearUserLocalData(localID);

            expect(removeItem).toHaveBeenCalledWith(getSessionKey(localID));
            expect(removeItem).toHaveBeenCalledWith(getSettingsStorageKey(localID));
            expect(removeItem).toHaveBeenCalledWith(getB2BEventsStorageKey(localID));
            expect(removeItem).toHaveBeenCalledWith(getTelemetryStorageKey(localID));
        });
    });

    describe('`localGarbageCollect`', () => {
        test('should remove legacy non-indexed storage keys', async () => {
            await localGarbageCollect([]);
            expect(removeItem).toHaveBeenCalledWith(B2B_STORAGE_KEY);
            expect(removeItem).toHaveBeenCalledWith(TELEMETRY_STORAGE_KEY);
        });

        test('should delete stale databases', async () => {
            getPassDBs.mockResolvedValue([db.getPassDBName('1'), db.getPassDBName('002')]);
            await localGarbageCollect([{ UserID: '2', LocalID: 0 } as EncryptedAuthSession]);

            expect(deletePassDB).toHaveBeenCalledWith('1');
            expect(deletePassDB).not.toHaveBeenCalledWith('2');
        });

        test('should remove stale localID indexed storage keys', async () => {
            [0, 42].forEach((localID) => {
                localStorage.setItem(getSettingsStorageKey(localID), 'settings');
                localStorage.setItem(getTelemetryStorageKey(localID), 'telemetry');
                localStorage.setItem(getB2BEventsStorageKey(localID), 'b2b');
            });

            await localGarbageCollect([{ UserID: '1', LocalID: 0 } as EncryptedAuthSession]);
            expect(removeItem).toHaveBeenCalledWith(getSettingsStorageKey(42));
            expect(removeItem).toHaveBeenCalledWith(getTelemetryStorageKey(42));
            expect(removeItem).toHaveBeenCalledWith(getB2BEventsStorageKey(42));

            expect(removeItem).not.toHaveBeenCalledWith(getSettingsStorageKey(0));
            expect(removeItem).not.toHaveBeenCalledWith(getTelemetryStorageKey(0));
            expect(removeItem).not.toHaveBeenCalledWith(getB2BEventsStorageKey(0));
        });
    });
});
