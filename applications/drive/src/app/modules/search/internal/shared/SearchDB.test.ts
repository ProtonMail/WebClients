import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import type { IndexPopulatorState, RepairNodeEntry } from './SearchDB';
import { SearchDB } from './SearchDB';
import type { TreeEventScopeId } from './types';
import { IndexKind } from './types';

const makeRepairEntry = (overrides: Partial<RepairNodeEntry> = {}): RepairNodeEntry => ({
    nodeUid: 'node-1',
    indexKind: IndexKind.MAIN,
    indexPopulatorKind: 'pop-1',
    treeEventScopeId: 'scope-1' as TreeEventScopeId,
    operation: 'index',
    parentNodeUid: 'parent-1',
    attempts: 0,
    firstFailedAt: 1000,
    lastAttemptAt: 1000,
    nextAttemptAt: 1000,
    lastError: 'boom',
    ...overrides,
});

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

        describe('getIndexBlobsByteSize', () => {
            it('returns 0 when no blobs exist for the kind', async () => {
                expect(await db.getIndexBlobsByteSize('main' as IndexKind)).toBe(0);
            });

            it('sums byte sizes of every blob under the given kind', async () => {
                await db.putEncryptedIndexBlob(['main', 'a'], new ArrayBuffer(10), identity);
                await db.putEncryptedIndexBlob(['main', 'b'], new ArrayBuffer(25), identity);

                expect(await db.getIndexBlobsByteSize('main' as IndexKind)).toBe(35);
            });

            it('excludes blobs from other kinds', async () => {
                await db.putEncryptedIndexBlob(['main', 'a'], new ArrayBuffer(10), identity);
                await db.putEncryptedIndexBlob(['photos', 'b'], new ArrayBuffer(100), identity);

                expect(await db.getIndexBlobsByteSize('main' as IndexKind)).toBe(10);
                expect(await db.getIndexBlobsByteSize('photos' as IndexKind)).toBe(100);
            });

            it('handles blob names that span the byte range', async () => {
                // Edge cases for the compound-key prefix scan: empty string, high-codepoint names.
                await db.putEncryptedIndexBlob(['main', ''], new ArrayBuffer(1), identity);
                await db.putEncryptedIndexBlob(['main', 'mid'], new ArrayBuffer(2), identity);
                await db.putEncryptedIndexBlob(['main', '￿￿'], new ArrayBuffer(4), identity);

                expect(await db.getIndexBlobsByteSize('main' as IndexKind)).toBe(7);
            });
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
            const state = {
                uid: 'pop-1',
                indexKind: IndexKind.MAIN,
                indexPopulatorKind: 'pop-1',
                treeEventScopeId: 'scope-1' as TreeEventScopeId,
                done: true,
                generation: 3,
                version: 1,
                progress: { files: 0, folders: 0, albums: 0, photos: 0 },
            };
            await db.putPopulatorState(state);
            expect(await db.getPopulatorState('pop-1')).toEqual(state);
        });

        it('getAllPopulatorStates returns all', async () => {
            await db.putPopulatorState({
                uid: 'pop-1',
                indexKind: IndexKind.MAIN,
                indexPopulatorKind: 'pop-1',
                treeEventScopeId: 'scope-1' as TreeEventScopeId,
                done: true,
                generation: 1,
                version: 1,
                progress: { files: 0, folders: 0, albums: 0, photos: 0 },
            });
            await db.putPopulatorState({
                uid: 'pop-2',
                indexKind: IndexKind.MAIN,
                indexPopulatorKind: 'pop-2',
                treeEventScopeId: 'scope-1' as TreeEventScopeId,
                done: false,
                generation: 2,
                version: 1,
                progress: { files: 0, folders: 0, albums: 0, photos: 0 },
            });

            const all = await db.getAllPopulatorStates();
            expect(all).toHaveLength(2);
        });

        it('deletes a populator state', async () => {
            await db.putPopulatorState({
                uid: 'pop-1',
                indexKind: IndexKind.MAIN,
                indexPopulatorKind: 'pop-1',
                treeEventScopeId: 'scope-1' as TreeEventScopeId,
                done: true,
                generation: 1,
                version: 1,
                progress: { files: 0, folders: 0, albums: 0, photos: 0 },
            });
            await db.deletePopulatorState('pop-1');
            expect(await db.getPopulatorState('pop-1')).toBeUndefined();
        });

        describe('documentCount', () => {
            const seedPopulatorState = (overrides: Partial<IndexPopulatorState> = {}) =>
                db.putPopulatorState({
                    uid: 'pop-1',
                    indexKind: IndexKind.MAIN,
                    indexPopulatorKind: 'pop-1',
                    treeEventScopeId: 'scope-1' as TreeEventScopeId,
                    done: true,
                    generation: 1,
                    version: 1,
                    progress: { files: 0, folders: 0, albums: 0, photos: 0 },
                    ...overrides,
                });

            it('returns undefined when no populator state exists for the index kind', async () => {
                expect(await db.getDocumentCount(IndexKind.MAIN)).toBeUndefined();
            });

            it('returns undefined before setDocumentCount is called', async () => {
                await seedPopulatorState();
                expect(await db.getDocumentCount(IndexKind.MAIN)).toBeUndefined();
            });

            it('returns the stored count after setDocumentCount, without disturbing other fields', async () => {
                await seedPopulatorState();
                await db.setDocumentCount(IndexKind.MAIN, 42);

                expect(await db.getDocumentCount(IndexKind.MAIN)).toBe(42);
                expect(await db.getPopulatorState('pop-1')).toEqual(
                    expect.objectContaining({ uid: 'pop-1', done: true, documentCount: 42 })
                );
            });

            it('is a no-op when no populator state exists yet for the index kind', async () => {
                await db.setDocumentCount(IndexKind.MAIN, 42);
                expect(await db.getDocumentCount(IndexKind.MAIN)).toBeUndefined();
            });
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

        describe('isSearchable', () => {
            it('returns false by default', async () => {
                expect(await db.isSearchable()).toBe(false);
            });

            it('returns true after markSearchableIndex', async () => {
                await db.markSearchableIndex();
                expect(await db.isSearchable()).toBe(true);
            });
        });

        describe('searchLibraryBlobVersion', () => {
            it('returns undefined by default', async () => {
                expect(await db.getSearchLibraryBlobVersion()).toBeUndefined();
            });

            it('returns the stored version after setSearchLibraryBlobVersion', async () => {
                await db.setSearchLibraryBlobVersion('2');
                expect(await db.getSearchLibraryBlobVersion()).toBe('2');
            });
        });

        describe('ensureCompatibleBlobVersion', () => {
            it('does nothing when the version matches', async () => {
                await db.setSearchLibraryBlobVersion('1');
                await db.markSearchableIndex();
                await db.ensureCompatibleBlobVersion('1');
                expect(await db.isSearchable()).toBe(true);
            });

            it('does nothing on a brand new index with nothing stored yet', async () => {
                await db.ensureCompatibleBlobVersion('1');
                expect(await db.getSearchLibraryBlobVersion()).toBe('1');
                expect(await db.isSearchable()).toBe(false);
            });

            it('clears the index when the version differs', async () => {
                await db.setSearchLibraryBlobVersion('1');
                await db.markSearchableIndex();
                await db.ensureCompatibleBlobVersion('2');
                expect(await db.getSearchLibraryBlobVersion()).toBe('2');
                expect(await db.isSearchable()).toBe(false);
            });

            it('treats a pre-versioning index (nothing stored) as "1" and clears when current version differs', async () => {
                await db.markSearchableIndex();
                await db.ensureCompatibleBlobVersion('2');
                expect(await db.getSearchLibraryBlobVersion()).toBe('2');
                expect(await db.isSearchable()).toBe(false);
            });
        });
    });

    describe('repairEntries', () => {
        it('stores and retrieves a repair entry', async () => {
            const entry = makeRepairEntry();
            await db.putRepairEntry(entry);
            expect(await db.getAllRepairEntries()).toEqual([entry]);
        });

        it('coalesces by [indexKind, nodeUid] (last write wins)', async () => {
            await db.putRepairEntry(makeRepairEntry({ operation: 'index', attempts: 3 }));
            await db.putRepairEntry(makeRepairEntry({ operation: 'remove', attempts: 0 }));
            const all = await db.getAllRepairEntries();
            expect(all).toHaveLength(1);
            expect(all[0].operation).toBe('remove');
            expect(all[0].attempts).toBe(0);
        });

        it('deletes a repair entry', async () => {
            await db.putRepairEntry(makeRepairEntry({ nodeUid: 'node-1' }));
            await db.putRepairEntry(makeRepairEntry({ nodeUid: 'node-2' }));
            await db.deleteRepairEntry([IndexKind.MAIN, 'node-1']);
            const remaining = await db.getAllRepairEntries();
            expect(remaining.map((e) => e.nodeUid)).toEqual(['node-2']);
        });

        it('countRepairEntries counts across all index kinds', async () => {
            expect(await db.countRepairEntries()).toBe(0);

            await db.putRepairEntry(makeRepairEntry({ nodeUid: 'node-1' }));
            await db.putRepairEntry(makeRepairEntry({ nodeUid: 'node-2', indexKind: 'photos' as IndexKind }));
            expect(await db.countRepairEntries()).toBe(2);
        });

        const SCOPE = 'scope-1' as TreeEventScopeId;
        const OTHER_SCOPE = 'scope-2' as TreeEventScopeId;

        it('recordRepairNode resets attempts/timestamps and is due immediately', async () => {
            await db.recordRepairNode({
                nodeUid: 'node-1',
                indexKind: IndexKind.MAIN,
                indexPopulatorKind: 'pop-1',
                treeEventScopeId: SCOPE,
                operation: 'index',
                parentNodeUid: 'parent-1',
                lastError: 'boom',
            });
            const [entry] = await db.getAllRepairEntries();
            expect(entry.attempts).toBe(0);
            expect(entry.nextAttemptAt).toBeLessThanOrEqual(Date.now());
            expect(entry.firstFailedAt).toBe(entry.lastAttemptAt);
        });

        it("getQuarantinedNodeUids returns only this populator's uids", async () => {
            await db.recordRepairNode({
                nodeUid: 'mine',
                indexKind: IndexKind.MAIN,
                indexPopulatorKind: 'pop-1',
                treeEventScopeId: SCOPE,
                operation: 'index',
            });
            await db.recordRepairNode({
                nodeUid: 'other',
                indexKind: IndexKind.MAIN,
                indexPopulatorKind: 'pop-1',
                treeEventScopeId: OTHER_SCOPE,
                operation: 'index',
            });
            expect(await db.getQuarantinedNodeUids(IndexKind.MAIN, SCOPE)).toEqual(new Set(['mine']));
        });

        it('clearRepairNode removes the entry', async () => {
            await db.recordRepairNode({
                nodeUid: 'node-1',
                indexKind: IndexKind.MAIN,
                indexPopulatorKind: 'pop-1',
                treeEventScopeId: SCOPE,
                operation: 'index',
            });
            await db.clearRepairNode(IndexKind.MAIN, 'node-1');
            expect(await db.getAllRepairEntries()).toHaveLength(0);
        });

        it('getAllDueRepairNodes returns every entry with nextAttemptAt <= now, across scopes', async () => {
            const now = 10_000;
            await db.putRepairEntry(
                makeRepairEntry({ nodeUid: 'due', treeEventScopeId: SCOPE, nextAttemptAt: now - 1 })
            );
            await db.putRepairEntry(
                makeRepairEntry({ nodeUid: 'not-due', treeEventScopeId: SCOPE, nextAttemptAt: now + 1 })
            );
            await db.putRepairEntry(
                makeRepairEntry({ nodeUid: 'other-scope', treeEventScopeId: OTHER_SCOPE, nextAttemptAt: now - 1 })
            );

            const due = await db.getAllDueRepairNodes(now);
            expect(due.map((e) => e.nodeUid).sort()).toEqual(['due', 'other-scope']);
        });

        it('recordFailedRepairAttempt bumps attempts and pushes out the next attempt', async () => {
            await db.putRepairEntry(makeRepairEntry({ nodeUid: 'node-1', attempts: 1, nextAttemptAt: 0 }));
            const [before] = await db.getAllRepairEntries();
            await db.recordFailedRepairAttempt(before, 'still broken');
            const [after] = await db.getAllRepairEntries();
            expect(after.attempts).toBe(2);
            expect(after.nextAttemptAt).toBeGreaterThan(Date.now());
            expect(after.lastError).toBe('still broken');
        });
    });

    describe('clearIndex', () => {
        it('clears isSearchable', async () => {
            await db.markSearchableIndex();
            await db.clearIndex();
            expect(await db.isSearchable()).toBe(false);
        });

        it('clears repair entries', async () => {
            await db.putRepairEntry(makeRepairEntry());
            await db.clearIndex();
            expect(await db.getAllRepairEntries()).toHaveLength(0);
        });

        it('preserves optIn and crypto key', async () => {
            await db.setOptedIn();
            await db.putSearchCryptoKey('secret', identity);
            await db.clearIndex();
            expect(await db.isOptedIn()).toBe(true);
            expect(await db.getSearchCryptoKey(identity)).toBe('secret');
        });
    });

    describe('isolation by userId', () => {
        it('uses separate databases per user', async () => {
            const db2 = await SearchDB.open('other-user');

            // Insert some data in default db:
            await db.putEncryptedIndexBlob(['main', 'blob-1'], new ArrayBuffer(4), identity);
            await db.putPopulatorState({
                uid: 'pop-1',
                indexKind: IndexKind.MAIN,
                indexPopulatorKind: 'pop-1',
                treeEventScopeId: 'scope-1' as TreeEventScopeId,
                done: false,
                generation: 2,
                version: 1,
                progress: { files: 0, folders: 0, albums: 0, photos: 0 },
            });
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
