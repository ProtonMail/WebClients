import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { generateAndImportKey } from '@proton/crypto/lib/subtle/aesGcm';

import { SearchDB } from '../../shared/SearchDB';
import { setupRealSearchLibraryWasm } from '../../testing/setupRealSearchLibraryWasm';
import { IndexKind, IndexRegistry } from './IndexRegistry';

setupRealSearchLibraryWasm();

describe('IndexRegistry integration', () => {
    let db: SearchDB;
    let registry: IndexRegistry;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        const cryptoKey = await generateAndImportKey();
        registry = new IndexRegistry(cryptoKey);
    });

    it('get() creates an instance for a kind', async () => {
        const instance = await registry.get(IndexKind.MAIN, db);
        expect(instance.engine).toBeDefined();
        expect(instance.blobStore).toBeDefined();
        expect(instance.indexWriter).toBeDefined();
        expect(instance.indexReader).toBeDefined();
    });

    it('get() returns the same instance on second call', async () => {
        const first = await registry.get(IndexKind.MAIN, db);
        const second = await registry.get(IndexKind.MAIN, db);
        expect(first).toBe(second);
    });

    it('getAll() iterates created instances', async () => {
        await registry.get(IndexKind.MAIN, db);
        await registry.get('TEST' as IndexKind, db);
        const all = [...registry.getAll()];
        expect(all).toHaveLength(2);
    });

    it('dispose() frees the engine and removes the entry', async () => {
        const first = await registry.get(IndexKind.MAIN, db);
        registry.dispose(IndexKind.MAIN);

        // Should create a fresh instance
        const second = await registry.get(IndexKind.MAIN, db);
        expect(second).not.toBe(first);
    });
});
