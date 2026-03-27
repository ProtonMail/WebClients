import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { SearchDB } from './SearchDB';
import type { TreeEventScopeId } from './types';

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
            expect(await db.getIndexBlob(['main', 'missing'])).toBeUndefined();
        });

        it('stores and retrieves a blob', async () => {
            const data = new ArrayBuffer(8);
            await db.putIndexBlob(['main', 'blob-1'], data);
            const result = await db.getIndexBlob(['main', 'blob-1']);
            expect(result).toEqual(data);
        });

        it('isolates by indexKind', async () => {
            const data1 = new ArrayBuffer(4);
            const data2 = new ArrayBuffer(8);
            await db.putIndexBlob(['main', 'blob-1'], data1);
            await db.putIndexBlob(['photos', 'blob-1'], data2);

            expect(await db.getIndexBlob(['main', 'blob-1'])).toEqual(data1);
            expect(await db.getIndexBlob(['photos', 'blob-1'])).toEqual(data2);
        });

        it('isolates by blobName', async () => {
            const data1 = new ArrayBuffer(4);
            const data2 = new ArrayBuffer(8);
            await db.putIndexBlob(['main', 'blob-a'], data1);
            await db.putIndexBlob(['main', 'blob-b'], data2);

            expect(await db.getIndexBlob(['main', 'blob-a'])).toEqual(data1);
            expect(await db.getIndexBlob(['main', 'blob-b'])).toEqual(data2);
        });

        it('overwrites existing blob', async () => {
            await db.putIndexBlob(['main', 'blob-1'], new ArrayBuffer(4));
            const updated = new ArrayBuffer(16);
            await db.putIndexBlob(['main', 'blob-1'], updated);

            expect(await db.getIndexBlob(['main', 'blob-1'])).toEqual(updated);
        });

        it('deletes a blob', async () => {
            await db.putIndexBlob(['main', 'blob-1'], new ArrayBuffer(4));
            await db.deleteIndexBlob(['main', 'blob-1']);
            expect(await db.getIndexBlob(['main', 'blob-1'])).toBeUndefined();
        });

        it('getAllIndexBlobKeys returns all keys', async () => {
            await db.putIndexBlob(['main', 'a'], new ArrayBuffer(1));
            await db.putIndexBlob(['main', 'b'], new ArrayBuffer(1));
            await db.putIndexBlob(['photos', 'c'], new ArrayBuffer(1));

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
            const state = { uid: 'pop-1', done: true, generation: 3 };
            await db.putPopulatorState(state);
            expect(await db.getPopulatorState('pop-1')).toEqual(state);
        });

        it('getAllPopulatorStates returns all', async () => {
            await db.putPopulatorState({ uid: 'pop-1', done: true, generation: 1 });
            await db.putPopulatorState({ uid: 'pop-2', done: false, generation: 2 });

            const all = await db.getAllPopulatorStates();
            expect(all).toHaveLength(2);
        });

        it('deletes a populator state', async () => {
            await db.putPopulatorState({ uid: 'pop-1', done: true, generation: 1 });
            await db.deletePopulatorState('pop-1');
            expect(await db.getPopulatorState('pop-1')).toBeUndefined();
        });
    });

    describe('isolation by userId', () => {
        it('uses separate databases per user', async () => {
            const db2 = await SearchDB.open('other-user');

            // Insert some data in default db:
            await db.putIndexBlob(['main', 'blob-1'], new ArrayBuffer(4));
            await db.putPopulatorState({ uid: 'pop-1', done: false, generation: 2 });
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
