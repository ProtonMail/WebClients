import { generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import type { Entry } from '@proton/proton-foundation-search';

import { SearchDB } from '../../../shared/SearchDB';
import { indexDocuments, makeTestIndexEntry } from '../../../testing/indexHelpers';
import { setupRealSearchLibraryWasm } from '../../../testing/setupRealSearchLibraryWasm';
import { IndexKind, IndexRegistry } from '../../index/IndexRegistry';
import { exportEntries } from '../../index/indexEntriesUtils';
import { readSearchLibraryIntegerAttribute, readSearchLibraryTagAttribute } from './entryAttributes';

setupRealSearchLibraryWasm();

describe('entryAttributes', () => {
    let db: SearchDB;
    let indexRegistry: IndexRegistry;
    let signal: AbortSignal;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        const cryptoKey = await generateAndImportKey();
        indexRegistry = new IndexRegistry(cryptoKey);
        signal = new AbortController().signal;
    });

    // Both readers must be called on the Entry while the export's `for await` still holds it -
    // exportEntries frees each Entry as soon as the loop advances past it, so returning one out of
    // the loop is a use-after-free (hit this while writing this exact kind of test elsewhere).
    async function withExportedEntry<T>(id: string, fn: (entry: Entry) => T): Promise<T> {
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        for await (const entry of exportEntries(instance, signal)) {
            if (entry.identifier() === id) {
                return fn(entry);
            }
        }
        throw new Error(`entry ${id} not found`);
    }

    describe('readSearchLibraryTagAttribute', () => {
        it('reads a tag attribute value', async () => {
            const instance = await indexRegistry.get(IndexKind.MAIN, db);
            await indexDocuments(instance.indexWriter, [
                makeTestIndexEntry('doc-1', { myTag: { kind: 'tag', value: 'hello' } }),
            ]);

            const value = await withExportedEntry('doc-1', (entry) => readSearchLibraryTagAttribute(entry, 'myTag'));
            expect(value).toBe('hello');
        });

        it('returns undefined for an attribute that does not exist on the entry', async () => {
            const instance = await indexRegistry.get(IndexKind.MAIN, db);
            await indexDocuments(instance.indexWriter, [makeTestIndexEntry('doc-1')]);

            const value = await withExportedEntry('doc-1', (entry) =>
                readSearchLibraryTagAttribute(entry, 'doesNotExist')
            );
            expect(value).toBeUndefined();
        });

        it('returns undefined rather than coercing when the attribute is actually an integer', async () => {
            const instance = await indexRegistry.get(IndexKind.MAIN, db);
            await indexDocuments(instance.indexWriter, [
                makeTestIndexEntry('doc-1', { myInt: { kind: 'integer', value: 42n } }),
            ]);

            const value = await withExportedEntry('doc-1', (entry) => readSearchLibraryTagAttribute(entry, 'myInt'));
            expect(value).toBeUndefined();
        });
    });

    describe('readSearchLibraryIntegerAttribute', () => {
        it('reads an integer attribute value, converted from the engine bigint round-trip', async () => {
            const instance = await indexRegistry.get(IndexKind.MAIN, db);
            await indexDocuments(instance.indexWriter, [
                makeTestIndexEntry('doc-1', { myInt: { kind: 'integer', value: 1_700_000_000_000n } }),
            ]);

            const value = await withExportedEntry('doc-1', (entry) =>
                readSearchLibraryIntegerAttribute(entry, 'myInt')
            );
            expect(value).toBe(1_700_000_000_000);
        });

        it('returns undefined for an attribute that does not exist on the entry', async () => {
            const instance = await indexRegistry.get(IndexKind.MAIN, db);
            await indexDocuments(instance.indexWriter, [makeTestIndexEntry('doc-1')]);

            const value = await withExportedEntry('doc-1', (entry) =>
                readSearchLibraryIntegerAttribute(entry, 'doesNotExist')
            );
            expect(value).toBeUndefined();
        });

        it('returns undefined rather than coercing when the attribute is actually a tag', async () => {
            const instance = await indexRegistry.get(IndexKind.MAIN, db);
            await indexDocuments(instance.indexWriter, [
                makeTestIndexEntry('doc-1', { myTag: { kind: 'tag', value: 'hello' } }),
            ]);

            const value = await withExportedEntry('doc-1', (entry) =>
                readSearchLibraryIntegerAttribute(entry, 'myTag')
            );
            expect(value).toBeUndefined();
        });

        it('handles a zero value correctly (falsy but present, distinct from missing)', async () => {
            const instance = await indexRegistry.get(IndexKind.MAIN, db);
            await indexDocuments(instance.indexWriter, [
                makeTestIndexEntry('doc-1', { myInt: { kind: 'integer', value: 0n } }),
            ]);

            const value = await withExportedEntry('doc-1', (entry) =>
                readSearchLibraryIntegerAttribute(entry, 'myInt')
            );
            expect(value).toBe(0);
        });
    });
});
