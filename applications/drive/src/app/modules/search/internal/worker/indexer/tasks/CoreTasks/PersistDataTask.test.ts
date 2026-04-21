import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { generateAndImportKey } from '@proton/crypto/lib/subtle/aesGcm';

import { SearchDB } from '../../../../shared/SearchDB';
import type { TreeEventScopeId } from '../../../../shared/types';
import { FakeMainThreadBridge } from '../../../../testing/FakeMainThreadBridge';
import { findTestIndexEntries, indexDocuments, makeTestIndexEntry } from '../../../../testing/indexHelpers';
import { makeTaskContext } from '../../../../testing/makeTaskContext';
import { makeTestPopulator } from '../../../../testing/makeTestPopulator';
import { setupRealSearchLibraryWasm } from '../../../../testing/setupRealSearchLibraryWasm';
import { IndexKind, IndexRegistry } from '../../../index/IndexRegistry';
import { TreeSubscriptionRegistry } from '../../TreeSubscriptionRegistry';
import { PersistDataTask } from './PersistDataTask';

setupRealSearchLibraryWasm();

const SCOPE_1 = 'scope-1' as TreeEventScopeId;
const SCOPE_2 = 'scope-2' as TreeEventScopeId;

describe('PersistDataTask', () => {
    let db: SearchDB;
    let bridge: FakeMainThreadBridge;
    let indexRegistry: IndexRegistry;
    let treeSubscriptionRegistry: TreeSubscriptionRegistry;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        bridge = new FakeMainThreadBridge();
        const cryptoKey = await generateAndImportKey();
        indexRegistry = new IndexRegistry(cryptoKey);
        treeSubscriptionRegistry = await TreeSubscriptionRegistry.create(bridge.asBridge(), db);
    });

    it('flushes index data to IndexedDB for multiple engines', async () => {
        // Register populators and verify cursors are persisted
        const pop1 = makeTestPopulator('pop-main', SCOPE_1);
        const pop2 = makeTestPopulator('pop-photos', SCOPE_2);
        await treeSubscriptionRegistry.register(SCOPE_1, pop1, 'evt-main-5', 5000);
        await treeSubscriptionRegistry.register(SCOPE_2, pop2, 'evt-photos-3', 3000);

        const PHOTOS = 'photos' as IndexKind;

        const main = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(main.indexWriter, [makeTestIndexEntry('main-doc-1'), makeTestIndexEntry('main-doc-2')]);

        const photos = await indexRegistry.get(PHOTOS, db);
        await indexDocuments(photos.indexWriter, [makeTestIndexEntry('photos-doc-1')]);

        const ctx = makeTaskContext({ indexRegistry, treeSubscriptionRegistry, db });
        await new PersistDataTask().execute(ctx);

        // Verify each engine's documents are searchable by the test tag
        const mainResults = await findTestIndexEntries(main.indexReader);
        expect(mainResults.map((r) => r.identifier).sort()).toEqual(['main-doc-1', 'main-doc-2']);

        const photosResults = await findTestIndexEntries(photos.indexReader);
        expect(photosResults.map((r) => r.identifier)).toEqual(['photos-doc-1']);

        // Verify blobs are persisted for both engines
        const keys = await db.getAllIndexBlobKeys();
        const indexKinds = new Set(keys.map(([kind]) => kind));
        expect(indexKinds).toContain(IndexKind.MAIN);
        expect(indexKinds).toContain(PHOTOS);

        // Verify subscription cursors
        const sub1 = await db.getSubscription(SCOPE_1);
        expect(sub1).toEqual({
            treeEventScopeId: SCOPE_1,
            lastEventId: 'evt-main-5',
            lastEventIdTime: 5000,
        });
        const sub2 = await db.getSubscription(SCOPE_2);
        expect(sub2).toEqual({
            treeEventScopeId: SCOPE_2,
            lastEventId: 'evt-photos-3',
            lastEventIdTime: 3000,
        });
    });

    it('persists the oldest cursor per tree event scope', async () => {
        // Register two populators under the same scope with different subscription times
        const pop1 = makeTestPopulator('pop-newer', SCOPE_1);
        const pop2 = makeTestPopulator('pop-older', SCOPE_1);
        await treeSubscriptionRegistry.register(SCOPE_1, pop1, 'evt-newer', 2000);
        await treeSubscriptionRegistry.register(SCOPE_1, pop2, 'evt-older', 1000);

        const ctx = makeTaskContext({ treeSubscriptionRegistry, db });
        await new PersistDataTask().execute(ctx);

        const sub = await db.getSubscription(SCOPE_1);
        expect(sub).toEqual({
            treeEventScopeId: SCOPE_1,
            lastEventId: 'evt-older',
            lastEventIdTime: 1000,
        });
    });

    it('persists separate cursors for different scopes', async () => {
        const pop1 = makeTestPopulator('pop-1', SCOPE_1);
        const pop2 = makeTestPopulator('pop-2', SCOPE_2);
        await treeSubscriptionRegistry.register(SCOPE_1, pop1, 'evt-1', 1000);
        await treeSubscriptionRegistry.register(SCOPE_2, pop2, 'evt-2', 2000);

        const ctx = makeTaskContext({ treeSubscriptionRegistry, db });
        await new PersistDataTask().execute(ctx);

        const sub1 = await db.getSubscription(SCOPE_1);
        const sub2 = await db.getSubscription(SCOPE_2);
        expect(sub1?.lastEventId).toBe('evt-1');
        expect(sub2?.lastEventId).toBe('evt-2');
    });

    it('does nothing when no registrations exist', async () => {
        const ctx = makeTaskContext({ treeSubscriptionRegistry, db });
        await new PersistDataTask().execute(ctx);

        const subs = await db.getAllSubscriptions();
        expect(subs).toHaveLength(0);
    });
});
