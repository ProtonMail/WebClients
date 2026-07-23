import { generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { SearchDB } from '../../shared/SearchDB';
import { findDocuments, indexDocuments, makeTestIndexEntry } from '../../testing/indexHelpers';
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

    it('get() builds an engine where all four built-in index types are queryable', async () => {
        // Guards against the engine-builder chain silently omitting an index type - the exact
        // failure mode that broke tag search in production (see bug_case_insensitive_tag_corruption
        // / the missing-index-registration incident): writes succeed either way, only a query
        // against the omitted index type would come back empty.
        const instance = await registry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, [
            makeTestIndexEntry('doc-1', {
                someTag: { kind: 'tag', value: 'tag-value' },
                someText: { kind: 'text', value: 'text value' },
                someBoolean: { kind: 'boolean', value: true },
                someInteger: { kind: 'integer', value: 42n },
            }),
        ]);

        expect(
            (await findDocuments(instance.indexReader, { someTag: 'tag-value' })).map((r) => r.identifier)
        ).toContain('doc-1');
        expect((await findDocuments(instance.indexReader, { someText: 'text' })).map((r) => r.identifier)).toContain(
            'doc-1'
        );
        expect((await findDocuments(instance.indexReader, { someBoolean: true })).map((r) => r.identifier)).toContain(
            'doc-1'
        );
        expect((await findDocuments(instance.indexReader, { someInteger: 42n })).map((r) => r.identifier)).toContain(
            'doc-1'
        );
    });
});
