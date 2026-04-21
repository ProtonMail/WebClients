import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import type { MainThreadBridge } from '../mainThread/MainThreadBridge';
import { SearchDB } from '../shared/SearchDB';
import { SearchIndexKeyManager } from './SearchIndexKeyManager';

const identityBuffer = async (d: ArrayBuffer) => d;
const identityString = async (d: string) => d;

jest.mock('../shared/errors', () => {
    const actual = jest.requireActual('../shared/errors');
    return { ...actual, sendErrorReportForSearch: jest.fn() };
});

function fakeBridge(): MainThreadBridge {
    return {
        cryptoProxyBridge: {
            openpgpEncryptIndexKey: async (plaintext: string) => `fake-openpgp:${plaintext}`,
            openpgpDecryptIndexKey: async (armored: string) => armored.replace('fake-openpgp:', ''),
        },
    } as MainThreadBridge;
}

describe('SearchIndexKeyManager', () => {
    let db: SearchDB;
    let bridge: MainThreadBridge;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        bridge = fakeBridge();
    });

    it('generates a new key on first call', async () => {
        const { cryptoKey } = await SearchIndexKeyManager.getOrCreateKey(db, bridge);

        expect(cryptoKey.type).toBe('secret');
    });

    it('stores the encrypted key in the DB', async () => {
        await SearchIndexKeyManager.getOrCreateKey(db, bridge);

        const stored = await db.getSearchCryptoKey(identityString);
        expect(stored).toBeDefined();
        expect(stored).toMatch(/^fake-openpgp:/);
    });

    it('returns the same key on subsequent calls', async () => {
        await SearchIndexKeyManager.getOrCreateKey(db, bridge);
        const storedAfterFirst = await db.getSearchCryptoKey(identityString);

        await SearchIndexKeyManager.getOrCreateKey(db, bridge);
        const storedAfterSecond = await db.getSearchCryptoKey(identityString);

        expect(storedAfterFirst).toBe(storedAfterSecond);
    });

    it('clears the index when generating a new key', async () => {
        // Seed some data that clearIndex would remove
        await db.putEncryptedIndexBlob(['test', 'blob1'], new ArrayBuffer(8), identityBuffer);

        await SearchIndexKeyManager.getOrCreateKey(db, bridge);

        const blob = await db.getDecryptedIndexBlob(['test', 'blob1'], identityBuffer);
        expect(blob).toBeUndefined();
    });

    it('does not clear the index when loading an existing key', async () => {
        // First call: generates key and clears
        await SearchIndexKeyManager.getOrCreateKey(db, bridge);

        // Seed data after key is created
        await db.putEncryptedIndexBlob(['test', 'blob1'], new ArrayBuffer(8), identityBuffer);

        // Second call: loads existing key, should NOT clear
        await SearchIndexKeyManager.getOrCreateKey(db, bridge);

        const blob = await db.getDecryptedIndexBlob(['test', 'blob1'], identityBuffer);
        expect(blob).toBeDefined();
    });

    it('regenerates key when decryption fails', async () => {
        // Store a key that the bridge can't decrypt
        await db.putSearchCryptoKey('corrupted-data', identityString);

        const { cryptoKey } = await SearchIndexKeyManager.getOrCreateKey(db, bridge);

        expect(cryptoKey.type).toBe('secret');

        // The corrupted key should have been replaced
        const stored = await db.getSearchCryptoKey(identityString);
        expect(stored).toMatch(/^fake-openpgp:/);
    });

    it('clears the index when regenerating after decryption failure', async () => {
        await db.putSearchCryptoKey('corrupted-data', identityString);
        await db.putEncryptedIndexBlob(['test', 'blob1'], new ArrayBuffer(8), identityBuffer);

        await SearchIndexKeyManager.getOrCreateKey(db, bridge);

        const blob = await db.getDecryptedIndexBlob(['test', 'blob1'], identityBuffer);
        expect(blob).toBeUndefined();
    });
});
