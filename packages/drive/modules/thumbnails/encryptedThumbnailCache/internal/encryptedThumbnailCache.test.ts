import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';
import { webcrypto } from 'node:crypto';

import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import {
    getCachedThumbnail,
    initEncryptedThumbnailCache,
    resetEncryptedThumbnailCacheForTest,
    setCachedThumbnail,
} from './encryptedThumbnailCache';
import { ThumbnailCacheDb } from './thumbnailCacheDb';

// @proton/jest-env provides crypto.getRandomValues but not crypto.subtle.
if (!globalThis.crypto.subtle) {
    Object.defineProperty(globalThis.crypto, 'subtle', { value: webcrypto.subtle, configurable: true });
}

// Mock OpenPGP wrap/unwrap with a reversible transform (real AES-GCM stays).
const encryptMessage = jest.fn(async ({ binaryData }: { binaryData: Uint8Array<ArrayBuffer> }) => ({
    message: `wrap:${JSON.stringify(Array.from(binaryData))}`,
}));
const decryptMessage = jest.fn(async ({ armoredMessage }: { armoredMessage: string }) => ({
    data: new Uint8Array(JSON.parse(armoredMessage.replace('wrap:', ''))),
}));

jest.mock('@protontech/crypto', () => ({
    CryptoProxy: {
        encryptMessage: (args: unknown) => encryptMessage(args as { binaryData: Uint8Array<ArrayBuffer> }),
        decryptMessage: (args: unknown) => decryptMessage(args as { armoredMessage: string }),
    },
}));

jest.mock('../../../../legacy/errorHandling', () => ({
    sendErrorReport: jest.fn(),
}));

const fakeUserKeys = [{ publicKey: 'pub', privateKey: 'priv' }] as unknown as DecryptedKey[];

const bytes = (values: number[]) => new Uint8Array(values) as Uint8Array<ArrayBuffer>;

describe('encryptedThumbnailCache', () => {
    beforeEach(() => {
        indexedDB = new IDBFactory();
        resetEncryptedThumbnailCacheForTest();
        jest.clearAllMocks();
    });

    afterEach(() => {
        resetEncryptedThumbnailCacheForTest();
    });

    it('round-trips thumbnail bytes through encrypt/store/decrypt', async () => {
        await initEncryptedThumbnailCache({ userKeys: fakeUserKeys, userId: 'user-1' });

        await setCachedThumbnail('node-1-rev-1', 'sd', bytes([1, 2, 3, 4]));
        const result = await getCachedThumbnail('node-1-rev-1', 'sd');

        expect(result && Array.from(result)).toEqual([1, 2, 3, 4]);
    });

    it('stores ciphertext, not the original bytes', async () => {
        await initEncryptedThumbnailCache({ userKeys: fakeUserKeys, userId: 'user-1' });
        await setCachedThumbnail('node-1-rev-1', 'sd', bytes([1, 2, 3, 4]));

        const db = await ThumbnailCacheDb.open('user-1');
        const stored = await db.getEntry('node-1-rev-1-sd');
        expect(stored).toBeDefined();
        // IV (12 bytes) + ciphertext + tag — never equals the 4 plaintext bytes.
        expect(stored && Array.from(stored)).not.toEqual([1, 2, 3, 4]);
    });

    it('is a no-op until initialised', async () => {
        await setCachedThumbnail('node-1-rev-1', 'sd', bytes([1, 2, 3]));
        expect(await getCachedThumbnail('node-1-rev-1', 'sd')).toBeUndefined();

        const db = await ThumbnailCacheDb.open('user-1');
        expect(await db.getEntry('node-1-rev-1-sd')).toBeUndefined();
    });

    it('returns undefined on a cache miss', async () => {
        await initEncryptedThumbnailCache({ userKeys: fakeUserKeys, userId: 'user-1' });
        expect(await getCachedThumbnail('missing-rev', 'sd')).toBeUndefined();
    });

    it('disables silently (no error report) when IndexedDB is unavailable', async () => {
        const { sendErrorReport } = jest.requireMock('../../../../legacy/errorHandling');
        const realIndexedDB = globalThis.indexedDB;
        (globalThis as { indexedDB?: unknown }).indexedDB = undefined;

        try {
            await initEncryptedThumbnailCache({ userKeys: fakeUserKeys, userId: 'user-no-idb' });

            await setCachedThumbnail('node-1-rev-1', 'sd', bytes([1, 2, 3]));
            expect(await getCachedThumbnail('node-1-rev-1', 'sd')).toBeUndefined();
            expect(sendErrorReport).not.toHaveBeenCalled();
        } finally {
            (globalThis as { indexedDB?: unknown }).indexedDB = realIndexedDB;
        }
    });

    it('isolates entries per user (separate databases)', async () => {
        await initEncryptedThumbnailCache({ userKeys: fakeUserKeys, userId: 'user-1' });
        await setCachedThumbnail('node-1-rev-1', 'sd', bytes([1, 2, 3]));

        resetEncryptedThumbnailCacheForTest();
        await initEncryptedThumbnailCache({ userKeys: fakeUserKeys, userId: 'user-2' });
        expect(await getCachedThumbnail('node-1-rev-1', 'sd')).toBeUndefined();
    });

    describe('key lifecycle', () => {
        it('generates and wraps a key on first init, reuses it on the next', async () => {
            await initEncryptedThumbnailCache({ userKeys: fakeUserKeys, userId: 'user-1' });
            expect(encryptMessage).toHaveBeenCalledTimes(1);
            expect(decryptMessage).not.toHaveBeenCalled();

            // Simulate an app reload: in-memory state cleared, wrapped key still in IDB.
            resetEncryptedThumbnailCacheForTest();
            await initEncryptedThumbnailCache({ userKeys: fakeUserKeys, userId: 'user-1' });

            expect(encryptMessage).toHaveBeenCalledTimes(1); // not regenerated
            expect(decryptMessage).toHaveBeenCalledTimes(1); // unwrapped instead
        });

        it('reuses the same key across reloads (data stays decryptable)', async () => {
            await initEncryptedThumbnailCache({ userKeys: fakeUserKeys, userId: 'user-1' });
            await setCachedThumbnail('node-1-rev-1', 'sd', bytes([9, 8, 7]));

            resetEncryptedThumbnailCacheForTest();
            await initEncryptedThumbnailCache({ userKeys: fakeUserKeys, userId: 'user-1' });

            const result = await getCachedThumbnail('node-1-rev-1', 'sd');
            expect(result && Array.from(result)).toEqual([9, 8, 7]);
        });

        it('regenerates the key and clears stale blobs when unwrap fails', async () => {
            await initEncryptedThumbnailCache({ userKeys: fakeUserKeys, userId: 'user-1' });
            await setCachedThumbnail('node-1-rev-1', 'sd', bytes([1, 2, 3]));

            // Next reload: unwrap throws (e.g. key rotation).
            resetEncryptedThumbnailCacheForTest();
            decryptMessage.mockRejectedValueOnce(new Error('cannot decrypt'));
            await initEncryptedThumbnailCache({ userKeys: fakeUserKeys, userId: 'user-1' });

            // Stale blob was cleared, and a new key was generated.
            expect(encryptMessage).toHaveBeenCalledTimes(2);
            const db = await ThumbnailCacheDb.open('user-1');
            expect(await db.getEntry('node-1-rev-1-sd')).toBeUndefined();
        });

        it('clears stale blobs when no wrapped key is stored', async () => {
            // Blob present but no key (e.g. the key entry was deleted): minting a new
            // key would leave this blob undecryptable, so it must be dropped.
            const db = await ThumbnailCacheDb.open('user-1');
            await db.putEntry('node-1-rev-1-sd', bytes([1, 2, 3]));
            db.close();

            await initEncryptedThumbnailCache({ userKeys: fakeUserKeys, userId: 'user-1' });

            expect(encryptMessage).toHaveBeenCalledTimes(1); // fresh key minted
            const reopened = await ThumbnailCacheDb.open('user-1');
            expect(await reopened.getEntry('node-1-rev-1-sd')).toBeUndefined();
        });
    });

    it('fails closed (undefined) when stored ciphertext cannot be decrypted', async () => {
        await initEncryptedThumbnailCache({ userKeys: fakeUserKeys, userId: 'user-1' });

        // Plant garbage at the slot the cache would read.
        const db = await ThumbnailCacheDb.open('user-1');
        await db.putEntry('node-1-rev-1-sd', bytes([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]));

        expect(await getCachedThumbnail('node-1-rev-1', 'sd')).toBeUndefined();
    });
});
