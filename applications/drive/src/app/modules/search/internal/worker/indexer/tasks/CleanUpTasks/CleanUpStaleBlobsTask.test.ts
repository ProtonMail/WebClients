import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import type { Engine } from '@proton/proton-foundation-search';
import { CleanupEventKind } from '@proton/proton-foundation-search';

import { SearchDB } from '../../../../shared/SearchDB';
import { indexDocuments, makeTestIndexEntry } from '../../../../testing/indexHelpers';
import { makeTaskContext } from '../../../../testing/makeTaskContext';
import { setupRealSearchLibraryWasm } from '../../../../testing/setupRealSearchLibraryWasm';
import type { IndexBlobStore } from '../../../index/IndexBlobStore';
import { IndexKind, IndexRegistry } from '../../../index/IndexRegistry';
import { CleanUpStaleBlobsTask } from './CleanUpStaleBlobsTask';

setupRealSearchLibraryWasm();

/** Drive the cleanup iterator with real blob loading and count Tracked events. */
async function getTrackedBlobCount(engine: Engine, blobStore: IndexBlobStore): Promise<number> {
    let count = 0;
    const cleanup = engine.cleanup();
    if (!cleanup) {
        throw new Error('Could not acquire cleanup handle');
    }
    try {
        for (let event = cleanup.next(); event !== undefined; event = cleanup.next()) {
            switch (event.kind()) {
                case CleanupEventKind.Load:
                    await blobStore.loadEvent(event);
                    break;
                case CleanupEventKind.Save:
                    await blobStore.saveEvent(event);
                    break;
                case CleanupEventKind.Release:
                    await blobStore.releaseEvent(event);
                    break;
                case CleanupEventKind.Tracked:
                    count++;
                    break;
            }
        }
    } finally {
        cleanup.free();
    }
    return count;
}

describe('CleanUpStaleBlobsTask', () => {
    let db: SearchDB;
    let indexRegistry: IndexRegistry;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        indexRegistry = new IndexRegistry();
    });

    it('completes without errors when no engines are registered', async () => {
        const ctx = makeTaskContext({ indexRegistry, db });
        await new CleanUpStaleBlobsTask().execute(ctx);

        const keys = await db.getAllIndexBlobKeys();
        expect(keys).toHaveLength(0);
    });

    it('keeps all blobs when there are no orphans', async () => {
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, [makeTestIndexEntry('doc-1'), makeTestIndexEntry('doc-2')]);

        const keysBefore = await db.getAllIndexBlobKeys();
        expect(keysBefore.length).toBeGreaterThan(0);

        const ctx = makeTaskContext({ indexRegistry, db });
        await new CleanUpStaleBlobsTask().execute(ctx);

        const keysAfter = await db.getAllIndexBlobKeys();
        expect(keysAfter).toEqual(keysBefore);
    });

    it('deletes orphan blobs while keeping tracked ones', async () => {
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, [makeTestIndexEntry('doc-1')]);

        // Insert orphan blobs that the engine doesn't know about.
        await db.putIndexBlob([IndexKind.MAIN, 'orphan-1'], new ArrayBuffer(8));
        await db.putIndexBlob([IndexKind.MAIN, 'orphan-2'], new ArrayBuffer(16));

        const keysBefore = await db.getAllIndexBlobKeys();
        const legitimateKeys = keysBefore.filter(([, name]) => name !== 'orphan-1' && name !== 'orphan-2');
        expect(legitimateKeys.length).toBeGreaterThan(0);

        const ctx = makeTaskContext({ indexRegistry, db });
        await new CleanUpStaleBlobsTask().execute(ctx);

        const keysAfter = await db.getAllIndexBlobKeys();
        const blobNames = keysAfter.map(([, name]) => name);
        expect(blobNames).not.toContain('orphan-1');
        expect(blobNames).not.toContain('orphan-2');

        // Legitimate blobs are still present.
        for (const [kind, name] of legitimateKeys) {
            expect(keysAfter).toContainEqual([kind, name]);
        }
    });

    it('does not delete orphan blobs belonging to a different indexKind', async () => {
        const OTHER_KIND = 'photos' as IndexKind;

        // Create a MAIN engine with data so the registry has something to iterate.
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, [makeTestIndexEntry('doc-1')]);

        // Insert an orphan under a different kind.
        await db.putIndexBlob([OTHER_KIND, 'photos-orphan'], new ArrayBuffer(8));

        const ctx = makeTaskContext({ indexRegistry, db });
        await new CleanUpStaleBlobsTask().execute(ctx);

        const keysAfter = await db.getAllIndexBlobKeys();
        const photosBlobs = keysAfter.filter(([kind]) => kind === OTHER_KIND);
        expect(photosBlobs).toContainEqual([OTHER_KIND, 'photos-orphan']);
    });

    it('continues cleaning other engines when one fails', async () => {
        const PHOTOS = 'photos' as IndexKind;

        const main = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(main.indexWriter, [makeTestIndexEntry('main-doc')]);

        const photos = await indexRegistry.get(PHOTOS, db);
        await indexDocuments(photos.indexWriter, [makeTestIndexEntry('photos-doc')]);

        // Insert orphan under photos kind.
        await db.putIndexBlob([PHOTOS, 'photos-orphan'], new ArrayBuffer(8));

        // Break the MAIN engine's cleanup by making it throw.
        jest.spyOn(main.engine, 'cleanup').mockImplementation(() => {
            throw new Error('simulated engine failure');
        });

        const ctx = makeTaskContext({ indexRegistry, db });
        await new CleanUpStaleBlobsTask().execute(ctx);

        // Photos orphan should still be cleaned up despite MAIN failing.
        const keysAfter = await db.getAllIndexBlobKeys();
        const photosOrphans = keysAfter.filter(([kind, name]) => kind === PHOTOS && name === 'photos-orphan');
        expect(photosOrphans).toHaveLength(0);
    });

    it('removes stale blob left after deleting an entry', async () => {
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        const { engine, blobStore } = instance;

        // Fresh engine: no blobs persisted yet, but engine tracks the manifest.
        expect(await db.getAllIndexBlobKeys()).toHaveLength(0);
        const trackedInitial = await getTrackedBlobCount(engine, blobStore);
        expect(trackedInitial).toBeGreaterThanOrEqual(1);

        // Add one entry — commit writes manifest + segment blob(s).
        await indexDocuments(instance.indexWriter, [makeTestIndexEntry('doc-1')]);
        const keysAfterInsert = await db.getAllIndexBlobKeys();
        expect(keysAfterInsert.length).toBeGreaterThanOrEqual(2);
        expect(await getTrackedBlobCount(engine, blobStore)).toBe(keysAfterInsert.length);

        // Delete the entry — write produces a new segment but the old one lingers.
        const session = instance.indexWriter.startWriteSession();
        session.remove('doc-1');
        await session.commit();
        const keysAfterDelete = await db.getAllIndexBlobKeys();
        expect(keysAfterDelete.length).toBeGreaterThan(keysAfterInsert.length);
        // Engine tracks fewer blobs than what's stored — the rest are stale.
        const trackedAfterDelete = await getTrackedBlobCount(engine, blobStore);
        expect(trackedAfterDelete).toBeLessThan(keysAfterDelete.length);

        // Cleanup should compact and remove the stale blob(s).
        const ctx = makeTaskContext({ indexRegistry, db });
        await new CleanUpStaleBlobsTask().execute(ctx);

        const keysAfterCleanup = await db.getAllIndexBlobKeys();
        expect(keysAfterCleanup.length).toBeLessThan(keysAfterDelete.length);

        // Blobs in IndexedDB should exactly match what the engine tracks.
        expect(await getTrackedBlobCount(engine, blobStore)).toBe(keysAfterCleanup.length);
    });

    it('skips engine gracefully when cleanup() returns null (write lock busy)', async () => {
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, [makeTestIndexEntry('doc-1')]);

        // Insert an orphan that would normally be cleaned up.
        await db.putIndexBlob([IndexKind.MAIN, 'orphan-busy'], new ArrayBuffer(8));

        // Simulate write lock being held.
        jest.spyOn(instance.engine, 'cleanup').mockReturnValue(undefined);

        const ctx = makeTaskContext({ indexRegistry, db });
        await new CleanUpStaleBlobsTask().execute(ctx);

        // Orphan should still exist because cleanup was skipped.
        const keysAfter = await db.getAllIndexBlobKeys();
        const blobNames = keysAfter.map(([, name]) => name);
        expect(blobNames).toContain('orphan-busy');
    });
});
