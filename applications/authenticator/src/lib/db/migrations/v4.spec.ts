import { Dexie, type Transaction } from 'dexie';
import type { Item } from 'proton-authenticator/lib/db/entities/items';

import { ENCRYPTION_ALGORITHM, generateKey } from '@proton/crypto/lib/subtle/aesGcm';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

import { V4_MIGRATION_BACK_UP_ID, backupForV4, migrateLegacyKeys, upgradeV4 } from './v4';

const createMockTransaction = (returns: { items: any; keys: any }) => {
    const tables = {
        items: { toArray: jest.fn().mockResolvedValue(returns.items), clear: jest.fn() },
        keys: { toArray: jest.fn().mockResolvedValue(returns.keys), clear: jest.fn() },
        backup: { add: jest.fn() },
    };

    return {
        db: { verno: 3 },
        table: jest.fn((name: keyof typeof tables) => tables[name]),
    } as unknown as Transaction;
};

const createLegacyKey = (key: Uint8Array<ArrayBuffer>) =>
    crypto.subtle.importKey('raw', key, ENCRYPTION_ALGORITHM, true, ['encrypt', 'decrypt']);

const waitFor = jest.spyOn(Dexie, 'waitFor').mockImplementation((val) => Promise.resolve(val));

describe('v4 migration', () => {
    afterAll(() => {
        waitFor.mockRestore();
    });

    describe('migrateLegacyKeys', () => {
        afterEach(() => {
            jest.clearAllMocks();
        });

        test('migrates legacy keys successfully', async () => {
            const key1 = generateKey();
            const key2 = generateKey();

            const result = await migrateLegacyKeys([
                { id: 'key1', userKeyId: 'user1', key: await createLegacyKey(key1) },
                { id: 'key2', userKeyId: 'user2', key: await createLegacyKey(key2) },
            ]);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({ id: 'key1', userKeyId: 'user1', encodedKey: uint8ArrayToBase64String(key1) });
            expect(result[1]).toEqual({ id: 'key2', userKeyId: 'user2', encodedKey: uint8ArrayToBase64String(key2) });
        });

        test('filters out keys without userKeyId', async () => {
            const key = generateKey();

            const result = await migrateLegacyKeys([
                { id: 'local', userKeyId: '', key: await createLegacyKey(generateKey()) },
                { id: 'key', userKeyId: 'user', key: await createLegacyKey(key) },
            ]);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({ id: 'key', userKeyId: 'user', encodedKey: uint8ArrayToBase64String(key) });
        });

        test('handles export key errors', async () => {
            const mockExportKey = jest.spyOn(crypto.subtle, 'exportKey');
            mockExportKey.mockRejectedValueOnce(new Error('Export failed'));

            const key1 = generateKey();
            const key2 = generateKey();

            const result = await migrateLegacyKeys([
                { id: 'key1', userKeyId: 'user1', key: await createLegacyKey(key1) },
                { id: 'key2', userKeyId: 'user2', key: await createLegacyKey(key2) },
            ]);

            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({ id: 'key2', userKeyId: 'user2', encodedKey: uint8ArrayToBase64String(key2) });
            mockExportKey.mockRestore();
        });
    });

    describe('backupForV4', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date(1234567890));
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test('creates backup with migrated data', async () => {
            const items = [{ id: 'item1', name: 'test' }] as unknown as Item[];
            const key = generateKey();
            const keys = [{ id: 'key1', userKeyId: 'user1', key: await createLegacyKey(key) }];

            const result = await backupForV4(3, items, keys);

            expect(result).toEqual({
                id: V4_MIGRATION_BACK_UP_ID,
                date: 1234567890,
                items,
                keys: [{ id: 'key1', userKeyId: 'user1', encodedKey: uint8ArrayToBase64String(key) }],
                version: 3,
            });
        });
    });

    describe('upgradeV4', () => {
        beforeEach(() => {
            jest.useFakeTimers();
            jest.setSystemTime(new Date(1234567890));
        });

        afterEach(() => {
            jest.useRealTimers();
        });

        test('performs complete upgrade', async () => {
            const items = [{ id: 'item1' }];
            const key = generateKey();
            const keys = [{ id: 'key1', userKeyId: 'user1', key: await createLegacyKey(key) }];

            const tx = createMockTransaction({ items, keys });
            await upgradeV4(tx);

            expect(tx.table('backup').add).toHaveBeenCalledWith({
                id: V4_MIGRATION_BACK_UP_ID,
                date: 1234567890,
                items,
                keys: [{ id: 'key1', userKeyId: 'user1', encodedKey: uint8ArrayToBase64String(key) }],
                version: 3,
            });

            expect(tx.table('items').clear).toHaveBeenCalled();
            expect(tx.table('keys').clear).toHaveBeenCalled();
        });
    });
});
