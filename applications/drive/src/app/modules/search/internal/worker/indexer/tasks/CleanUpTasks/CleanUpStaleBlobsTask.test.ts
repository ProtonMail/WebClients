import { generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import type { Engine } from '@proton/proton-foundation-search';
import { CleanupEventKind } from '@proton/proton-foundation-search';

import { SearchDB } from '../../../../shared/SearchDB';
import { SearchLibraryError } from '../../../../shared/errors';
import { indexDocuments, makeTestIndexEntry } from '../../../../testing/indexHelpers';
import { makeTaskContext } from '../../../../testing/makeTaskContext';
import { setupRealSearchLibraryWasm } from '../../../../testing/setupRealSearchLibraryWasm';
import type { IndexBlobStore } from '../../../index/IndexBlobStore';
import { IndexKind, IndexRegistry } from '../../../index/IndexRegistry';
import { CleanUpStaleBlobsTask } from './CleanUpStaleBlobsTask';

setupRealSearchLibraryWasm();

const identity = async (d: ArrayBuffer) => d;

jest.mock('../../../../shared/errors', () => {
    const actual = jest.requireActual('../../../../shared/errors');
    return {
        ...actual,
        sendErrorReportForSearch: jest.fn(),
    };
});

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
        const cryptoKey = await generateAndImportKey();
        indexRegistry = new IndexRegistry(cryptoKey);
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
        await db.putEncryptedIndexBlob([IndexKind.MAIN, 'orphan-1'], new ArrayBuffer(8), identity);
        await db.putEncryptedIndexBlob([IndexKind.MAIN, 'orphan-2'], new ArrayBuffer(16), identity);

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
        await db.putEncryptedIndexBlob([OTHER_KIND, 'photos-orphan'], new ArrayBuffer(8), identity);

        const ctx = makeTaskContext({ indexRegistry, db });
        await new CleanUpStaleBlobsTask().execute(ctx);

        const keysAfter = await db.getAllIndexBlobKeys();
        const photosBlobs = keysAfter.filter(([kind]) => kind === OTHER_KIND);
        expect(photosBlobs).toContainEqual([OTHER_KIND, 'photos-orphan']);
    });

    it('surfaces a wedged engine instead of absorbing it', async () => {
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, [makeTestIndexEntry('main-doc')]);

        jest.spyOn(instance.engine, 'cleanup').mockImplementation(() => {
            throw new Error('simulated engine failure');
        });

        const ctx = makeTaskContext({ indexRegistry, db });
        // Absorbed here, the index would rot with no permanentError set and no recovery offered to
        // the user.
        await expect(new CleanUpStaleBlobsTask().execute(ctx)).rejects.toBeInstanceOf(SearchLibraryError);
    });

    it('keeps absorbing a non-systemic failure', async () => {
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, [makeTestIndexEntry('main-doc')]);

        // A transient IndexedDB hiccup while listing blobs: worth reporting, not worth stopping
        // the queue over.
        jest.spyOn(db, 'getAllIndexBlobKeys').mockRejectedValueOnce(
            new DOMException('tx timed out', 'TransactionInactiveError')
        );

        const ctx = makeTaskContext({ indexRegistry, db });
        await expect(new CleanUpStaleBlobsTask().execute(ctx)).resolves.toBeUndefined();
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
        await db.putEncryptedIndexBlob([IndexKind.MAIN, 'orphan-busy'], new ArrayBuffer(8), identity);

        // Simulate write lock being held.
        jest.spyOn(instance.engine, 'cleanup').mockReturnValue(undefined);

        const ctx = makeTaskContext({ indexRegistry, db });
        await new CleanUpStaleBlobsTask().execute(ctx);

        // Orphan should still exist because cleanup was skipped.
        const keysAfter = await db.getAllIndexBlobKeys();
        const blobNames = keysAfter.map(([, name]) => name);
        expect(blobNames).toContain('orphan-busy');
    });

    describe('yields to in-flight reads', () => {
        it('defers and re-enqueues itself while a read is in flight, deleting nothing', async () => {
            const instance = await indexRegistry.get(IndexKind.MAIN, db);
            await indexDocuments(instance.indexWriter, [makeTestIndexEntry('doc-1')]);
            await db.putEncryptedIndexBlob([IndexKind.MAIN, 'orphan-read'], new ArrayBuffer(8), identity);

            const cleanupSpy = jest.spyOn(instance.engine, 'cleanup');
            // Simulate an in-flight search/export holding the blob store open.
            instance.blobStore.beginRead();

            const ctx = makeTaskContext({ indexRegistry, db });
            await new CleanUpStaleBlobsTask().execute(ctx);

            // The deletion path is never entered and nothing is removed.
            expect(cleanupSpy).not.toHaveBeenCalled();
            const blobNames = (await db.getAllIndexBlobKeys()).map(([, name]) => name);
            expect(blobNames).toContain('orphan-read');
            // A retry is scheduled for later.
            expect(ctx.enqueueDelayed).toHaveBeenCalledTimes(1);
            expect(ctx.enqueueDelayed).toHaveBeenCalledWith(expect.any(CleanUpStaleBlobsTask), expect.any(Number));
        });

        it('resumes deleting once the in-flight read finishes', async () => {
            const instance = await indexRegistry.get(IndexKind.MAIN, db);
            await indexDocuments(instance.indexWriter, [makeTestIndexEntry('doc-1')]);
            await db.putEncryptedIndexBlob([IndexKind.MAIN, 'orphan-read'], new ArrayBuffer(8), identity);

            instance.blobStore.beginRead();
            instance.blobStore.endRead();

            const ctx = makeTaskContext({ indexRegistry, db });
            await new CleanUpStaleBlobsTask().execute(ctx);

            const blobNames = (await db.getAllIndexBlobKeys()).map(([, name]) => name);
            expect(blobNames).not.toContain('orphan-read');
            expect(ctx.enqueueDelayed).not.toHaveBeenCalled();
        });
    });
});
