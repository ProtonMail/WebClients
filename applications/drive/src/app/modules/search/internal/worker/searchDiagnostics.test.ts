import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { SearchDB } from '../shared/SearchDB';
import { IndexKind } from '../shared/types';
import type { TreeEventScopeId } from '../shared/types';
import { gatherSearchDiagnostics } from './searchDiagnostics';

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

        await expect(gatherSearchDiagnostics(db)).resolves.toEqual({
            blobCount: 2,
            blobSizeMb: 12 / 1024 / 1024,
            quarantinedNodeCount: 1,
            storageUsageMb: 10,
            storageQuotaMb: 100,
            documentCount: 5,
        });
    });

    it('returns undefined, without throwing, when a lookup fails', async () => {
        jest.spyOn(db, 'countIndexBlobs').mockRejectedValueOnce(new Error('IDB unavailable'));

        await expect(gatherSearchDiagnostics(db)).resolves.toBeUndefined();
    });

    it('returns undefined, without throwing, when navigator.storage.estimate fails', async () => {
        Object.defineProperty(navigator, 'storage', {
            value: { estimate: jest.fn().mockRejectedValue(new Error('unsupported')) },
            configurable: true,
        });

        await expect(gatherSearchDiagnostics(db)).resolves.toBeUndefined();
    });
});
