import { generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { SearchDB } from '../shared/SearchDB';
import { IndexKind } from '../shared/types';
import type { TreeEventScopeId } from '../shared/types';
import { indexDocuments, makeTestIndexEntry } from '../testing/indexHelpers';
import { setupRealSearchLibraryWasm } from '../testing/setupRealSearchLibraryWasm';
import { IndexRegistry } from './index/IndexRegistry';
import { gatherSearchDiagnostics } from './searchDiagnostics';

setupRealSearchLibraryWasm();

jest.mock('../shared/Logger');

const identity = async <T>(d: T) => d;

describe('gatherSearchDiagnostics', () => {
    let db: SearchDB;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        Object.defineProperty(navigator, 'storage', {
            value: { estimate: jest.fn().mockResolvedValue({ usage: 10 * 1024 * 1024, quota: 100 * 1024 * 1024 }) },
            configurable: true,
        });
    });

    it('assembles blob count/size, document count, quarantined count, and storage estimate', async () => {
        await db.putEncryptedIndexBlob(['main', 'blob-1'], new ArrayBuffer(4), identity);
        await db.putEncryptedIndexBlob(['main', 'blob-2'], new ArrayBuffer(8), identity);
        await db.putPopulatorState({
            uid: 'pop-1',
            indexKind: IndexKind.MAIN,
            indexPopulatorKind: 'pop-1',
            treeEventScopeId: 'scope-1' as TreeEventScopeId,
            done: true,
            generation: 1,
            version: 1,
            progress: { files: 0, folders: 0, albums: 0, photos: 0 },
            documentCount: 5,
        });
        await db.recordRepairNode({
            nodeUid: 'node-1',
            indexKind: IndexKind.MAIN,
            indexPopulatorKind: 'pop-1',
            treeEventScopeId: 'scope-1' as TreeEventScopeId,
            operation: 'index',
        });

        await expect(gatherSearchDiagnostics(db, null)).resolves.toEqual({
            blobCount: 2,
            // 12 bytes rounds to 0 at 3 decimal places of MB.
            blobsTotalSizeMb: 0,
            quarantinedNodeCount: 1,
            storageUsageMb: 10,
            storageQuotaMb: 100,
            documentCount: 5,
            blobCacheEntryCount: undefined,
            blobCachePendingFreeCount: undefined,
            blobCacheSizesMb: undefined,
            wasmMemoryMb: undefined,
            lastCommitDurationMs: undefined,
        });
    });

    it('returns undefined, without throwing, when a lookup fails', async () => {
        jest.spyOn(db, 'countIndexBlobs').mockRejectedValueOnce(new Error('IDB unavailable'));

        await expect(gatherSearchDiagnostics(db, null)).resolves.toBeUndefined();
    });

    it('returns undefined, without throwing, when navigator.storage.estimate fails', async () => {
        Object.defineProperty(navigator, 'storage', {
            value: { estimate: jest.fn().mockRejectedValue(new Error('unsupported')) },
            configurable: true,
        });

        await expect(gatherSearchDiagnostics(db, null)).resolves.toBeUndefined();
    });

    it('omits blob cache fields when no engine instance has been built for the index', async () => {
        const registry = new IndexRegistry(await generateAndImportKey());

        const diagnostics = await gatherSearchDiagnostics(db, registry);

        expect(diagnostics?.blobCacheEntryCount).toBeUndefined();
        expect(diagnostics?.blobCachePendingFreeCount).toBeUndefined();
        expect(diagnostics?.blobCacheSizesMb).toBeUndefined();
    });

    it('reports live blob cache state once an engine instance has been built', async () => {
        const registry = new IndexRegistry(await generateAndImportKey());
        const instance = await registry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, [makeTestIndexEntry('doc-1')]);

        const diagnostics = await gatherSearchDiagnostics(db, registry);

        const expectedStats = instance.blobStore.getCacheStats();
        expect(diagnostics?.blobCacheEntryCount).toBe(expectedStats.blobsCount);
        expect(diagnostics?.blobCachePendingFreeCount).toBe(expectedStats.pendingFreeBlobsCount);
        expect(diagnostics?.blobCacheEntryCount).toBeGreaterThan(0);
        expect(diagnostics?.blobCacheSizesMb).toBe(expectedStats.blobSizesInMb.map((mb) => mb.toFixed(3)).join('/'));
        expect(diagnostics?.wasmMemoryMb).toBeGreaterThan(0);
        expect(diagnostics?.lastCommitDurationMs).toBe(instance.indexWriter.getLastCommitDurationMs());
    });
});
