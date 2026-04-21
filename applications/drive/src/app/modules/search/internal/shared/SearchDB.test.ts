import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { SearchDB } from './SearchDB';
import type { TreeEventScopeId } from './types';

const identity = async <T>(d: T) => d;

describe('SearchDB', () => {
    let db: SearchDB;

    beforeEach(async () => {
        // Fresh IndexedDB for each test.
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
    });

    it('starts with no records', async () => {
        expect(await db.getAllIndexBlobKeys()).toHaveLength(0);
        expect(await db.getAllSubscriptions()).toHaveLength(0);
        expect(await db.getAllPopulatorStates()).toHaveLength(0);
    });

    describe('indexBlobs', () => {
        it('returns undefined for missing blob', async () => {
            expect(await db.getDecryptedIndexBlob(['main', 'missing'], identity)).toBeUndefined();
        });

        it('stores and retrieves a blob', async () => {
            const data = new ArrayBuffer(8);
            await db.putEncryptedIndexBlob(['main', 'blob-1'], data, identity);
            const result = await db.getDecryptedIndexBlob(['main', 'blob-1'], identity);
            expect(result).toEqual(data);
        });

        it('isolates by indexKind', async () => {
            const data1 = new ArrayBuffer(4);
            const data2 = new ArrayBuffer(8);
            await db.putEncryptedIndexBlob(['main', 'blob-1'], data1, identity);
            await db.putEncryptedIndexBlob(['photos', 'blob-1'], data2, identity);

            expect(await db.getDecryptedIndexBlob(['main', 'blob-1'], identity)).toEqual(data1);
            expect(await db.getDecryptedIndexBlob(['photos', 'blob-1'], identity)).toEqual(data2);
        });

        it('isolates by blobName', async () => {
            const data1 = new ArrayBuffer(4);
            const data2 = new ArrayBuffer(8);
            await db.putEncryptedIndexBlob(['main', 'blob-a'], data1, identity);
            await db.putEncryptedIndexBlob(['main', 'blob-b'], data2, identity);

            expect(await db.getDecryptedIndexBlob(['main', 'blob-a'], identity)).toEqual(data1);
            expect(await db.getDecryptedIndexBlob(['main', 'blob-b'], identity)).toEqual(data2);
        });

        it('overwrites existing blob', async () => {
            await db.putEncryptedIndexBlob(['main', 'blob-1'], new ArrayBuffer(4), identity);
            const updated = new ArrayBuffer(16);
            await db.putEncryptedIndexBlob(['main', 'blob-1'], updated, identity);

            expect(await db.getDecryptedIndexBlob(['main', 'blob-1'], identity)).toEqual(updated);
        });

        it('deletes a blob', async () => {
            await db.putEncryptedIndexBlob(['main', 'blob-1'], new ArrayBuffer(4), identity);
            await db.deleteIndexBlob(['main', 'blob-1']);
            expect(await db.getDecryptedIndexBlob(['main', 'blob-1'], identity)).toBeUndefined();
        });

        // Verify that putEncryptedIndexBlob actually passes data through the encrypt callback
        // before persisting — not just storing plaintext.
        it('applies encrypt when storing a blob', async () => {
            const plaintext = new Uint8Array([1, 2, 3]).buffer as ArrayBuffer;
            const prefix = new Uint8Array([0xee]);
            const dummyEncryptThatPrependAByte = async (data: ArrayBuffer) =>
                new Uint8Array([...prefix, ...new Uint8Array(data)]).buffer as ArrayBuffer;

            await db.putEncryptedIndexBlob(['main', 'blob-1'], plaintext, dummyEncryptThatPrependAByte);

            // Reading with identity exposes the raw stored bytes — should have the prefix
            const raw = await db.getDecryptedIndexBlob(['main', 'blob-1'], identity);
            expect(raw).toBeDefined();
            expect(new Uint8Array(raw as ArrayBuffer)).toEqual(new Uint8Array([0xee, 1, 2, 3]));
        });

        // Verify that getDecryptedIndexBlob actually passes stored data through the decrypt
        // callback before returning — not just returning raw ciphertext.
        it('applies decrypt when reading a blob', async () => {
            const plaintext = new Uint8Array([1, 2, 3]).buffer as ArrayBuffer;
            await db.putEncryptedIndexBlob(['main', 'blob-1'], plaintext, identity);

            // Strip the first byte
            const dummyDecryptThatRemoveAByte = async (data: ArrayBuffer) => data.slice(1);

            const result = await db.getDecryptedIndexBlob(['main', 'blob-1'], dummyDecryptThatRemoveAByte);
            expect(result).toBeDefined();
            expect(new Uint8Array(result as ArrayBuffer)).toEqual(new Uint8Array([2, 3]));
        });

        it('getAllIndexBlobKeys returns all keys', async () => {
            await db.putEncryptedIndexBlob(['main', 'a'], new ArrayBuffer(1), identity);
            await db.putEncryptedIndexBlob(['main', 'b'], new ArrayBuffer(1), identity);
            await db.putEncryptedIndexBlob(['photos', 'c'], new ArrayBuffer(1), identity);

            const keys = await db.getAllIndexBlobKeys();
            expect(keys).toHaveLength(3);
            expect(keys).toContainEqual(['main', 'a']);
            expect(keys).toContainEqual(['main', 'b']);
            expect(keys).toContainEqual(['photos', 'c']);
        });
    });

    describe('treeEventScopeSubscriptions', () => {
        const scopeId = 'scope-1' as TreeEventScopeId;

        it('returns undefined for missing subscription', async () => {
            expect(await db.getSubscription(scopeId)).toBeUndefined();
        });

        it('stores and retrieves a subscription', async () => {
            const sub = { treeEventScopeId: scopeId, lastEventId: 'evt-5', lastEventIdTime: 1000 };
            await db.putSubscription(sub);
            expect(await db.getSubscription(scopeId)).toEqual(sub);
        });

        it('getAllSubscriptions returns all', async () => {
            const sub1 = {
                treeEventScopeId: 'scope-1' as TreeEventScopeId,
                lastEventId: 'evt-1',
                lastEventIdTime: 100,
            };
            const sub2 = {
                treeEventScopeId: 'scope-2' as TreeEventScopeId,
                lastEventId: 'evt-2',
                lastEventIdTime: 200,
            };
            await db.putSubscription(sub1);
            await db.putSubscription(sub2);

            const all = await db.getAllSubscriptions();
            expect(all).toHaveLength(2);
        });

        it('deletes a subscription', async () => {
            const sub = { treeEventScopeId: scopeId, lastEventId: 'evt-5', lastEventIdTime: 1000 };
            await db.putSubscription(sub);
            await db.deleteSubscription(scopeId);
            expect(await db.getSubscription(scopeId)).toBeUndefined();
        });
    });

    describe('indexPopulatorStates', () => {
        it('returns undefined for missing state', async () => {
            expect(await db.getPopulatorState('pop-1')).toBeUndefined();
        });

        it('stores and retrieves populator state', async () => {
            const state = { uid: 'pop-1', done: true, generation: 3, version: 1 };
            await db.putPopulatorState(state);
            expect(await db.getPopulatorState('pop-1')).toEqual(state);
        });

        it('getAllPopulatorStates returns all', async () => {
            await db.putPopulatorState({ uid: 'pop-1', done: true, generation: 1, version: 1 });
            await db.putPopulatorState({ uid: 'pop-2', done: false, generation: 2, version: 1 });

            const all = await db.getAllPopulatorStates();
            expect(all).toHaveLength(2);
        });

        it('deletes a populator state', async () => {
            await db.putPopulatorState({ uid: 'pop-1', done: true, generation: 1, version: 1 });
            await db.deletePopulatorState('pop-1');
            expect(await db.getPopulatorState('pop-1')).toBeUndefined();
        });
    });

    describe('searchCryptoKey', () => {
        it('returns undefined when no key is stored', async () => {
            const result = await db.getSearchCryptoKey(identity);
            expect(result).toBeUndefined();
        });

        it('round-trips a key through encrypt and decrypt', async () => {
            const encrypt = async (plaintext: string) => `encrypted:${plaintext}`;
            const decrypt = async (ciphertext: string) => ciphertext.replace('encrypted:', '');

            await db.putSearchCryptoKey('my-secret-key', encrypt);
            const result = await db.getSearchCryptoKey(decrypt);

            expect(result).toBe('my-secret-key');
        });

        it('applies encrypt before storing', async () => {
            const encrypt = async (plaintext: string) => `encrypted:${plaintext}`;

            await db.putSearchCryptoKey('plain', encrypt);

            // Reading with identity exposes the raw stored value
            const raw = await db.getSearchCryptoKey(identity);
            expect(raw).toBe('encrypted:plain');
        });

        it('applies decrypt when reading', async () => {
            const encrypt = async (plaintext: string) => `encrypted:${plaintext}`;
            const decrypt = async (ciphertext: string) => ciphertext.replace('encrypted:', '');

            await db.putSearchCryptoKey('data', encrypt);
            const result = await db.getSearchCryptoKey(decrypt);

            expect(result).toBe('data');
        });
    });

    describe('userPreferences', () => {
        it('isOptedIn returns false by default', async () => {
            expect(await db.isOptedIn()).toBe(false);
        });

        it('isOptedIn returns true after setOptedIn', async () => {
            await db.setOptedIn();
            expect(await db.isOptedIn()).toBe(true);
        });
    });

    describe('isolation by userId', () => {
        it('uses separate databases per user', async () => {
            const db2 = await SearchDB.open('other-user');

            // Insert some data in default db:
            await db.putEncryptedIndexBlob(['main', 'blob-1'], new ArrayBuffer(4), identity);
            await db.putPopulatorState({ uid: 'pop-1', done: false, generation: 2, version: 1 });
            const scope = '123' as TreeEventScopeId;
            const sub = { treeEventScopeId: scope, lastEventId: 'evt-5', lastEventIdTime: 1000 };
            await db.putSubscription(sub);

            // Verify data is added to db:
            expect(await db.getAllIndexBlobKeys()).toHaveLength(1);
            expect(await db.getAllSubscriptions()).toHaveLength(1);
            expect(await db.getAllPopulatorStates()).toHaveLength(1);

            // Verify no data added to db2:
            expect(await db2.getAllIndexBlobKeys()).toHaveLength(0);
            expect(await db2.getAllSubscriptions()).toHaveLength(0);
            expect(await db2.getAllPopulatorStates()).toHaveLength(0);
        });
    });
});
