import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { generateAndImportKey } from '@proton/crypto/lib/subtle/aesGcm';

import { SearchDB } from '../../shared/SearchDB';
import { findTestIndexEntries, indexDocuments, makeTestIndexEntry } from '../../testing/indexHelpers';
import { setupRealSearchLibraryWasm } from '../../testing/setupRealSearchLibraryWasm';
import { IndexKind, IndexRegistry } from './IndexRegistry';
import { exportEntries, removeDocumentIds } from './indexEntriesUtils';

setupRealSearchLibraryWasm();

describe('indexEntriesUtils', () => {
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

    describe('exportEntries', () => {
        it('yields every entry in the engine', async () => {
            const instance = await indexRegistry.get(IndexKind.MAIN, db);
            await indexDocuments(instance.indexWriter, [
                makeTestIndexEntry('a'),
                makeTestIndexEntry('b'),
                makeTestIndexEntry('c'),
            ]);

            const ids: string[] = [];
            for await (const entry of exportEntries(instance, signal)) {
                ids.push(entry.identifier());
            }
            expect(ids.sort()).toEqual(['a', 'b', 'c']);
        });

        it('yields nothing for an empty engine', async () => {
            const instance = await indexRegistry.get(IndexKind.MAIN, db);
            const ids: string[] = [];
            for await (const entry of exportEntries(instance, signal)) {
                ids.push(entry.identifier());
            }
            expect(ids).toEqual([]);
        });

        it('throws synchronously if the signal is already aborted', async () => {
            const instance = await indexRegistry.get(IndexKind.MAIN, db);
            const aborted = new AbortController();
            aborted.abort();
            const gen = exportEntries(instance, aborted.signal);
            await expect(gen.next()).rejects.toThrow();
        });
    });

    describe('removeDocumentIds', () => {
        it('removes the specified documents and returns the count', async () => {
            const instance = await indexRegistry.get(IndexKind.MAIN, db);
            await indexDocuments(instance.indexWriter, [
                makeTestIndexEntry('keep'),
                makeTestIndexEntry('drop-1'),
                makeTestIndexEntry('drop-2'),
            ]);

            const removed = await removeDocumentIds(instance, ['drop-1', 'drop-2'], signal);
            expect(removed).toBe(2);

            const remaining = await findTestIndexEntries(instance.indexReader);
            expect(remaining.map((r) => r.identifier).sort()).toEqual(['keep']);
        });

        it('is a no-op when given an empty set', async () => {
            const instance = await indexRegistry.get(IndexKind.MAIN, db);
            await indexDocuments(instance.indexWriter, [makeTestIndexEntry('doc-1')]);

            const removed = await removeDocumentIds(instance, [], signal);
            expect(removed).toBe(0);

            const remaining = await findTestIndexEntries(instance.indexReader);
            expect(remaining.map((r) => r.identifier)).toEqual(['doc-1']);
        });

        it('read after remove works (WASM ownership regression guard)', async () => {
            // Regression guard for the WASM "attempted to take ownership while
            // it was borrowed" bug: reading *after* removeDocumentIds completes
            // must succeed because the write session is disposed at commit.
            const instance = await indexRegistry.get(IndexKind.MAIN, db);
            await indexDocuments(instance.indexWriter, [makeTestIndexEntry('a'), makeTestIndexEntry('b')]);
            await removeDocumentIds(instance, ['a'], signal);

            const remaining = await findTestIndexEntries(instance.indexReader);
            expect(remaining.map((r) => r.identifier)).toEqual(['b']);
        });

        it('propagates abort between removes without leaving a dangling write session', async () => {
            const instance = await indexRegistry.get(IndexKind.MAIN, db);
            await indexDocuments(instance.indexWriter, [makeTestIndexEntry('a'), makeTestIndexEntry('b')]);

            const controller = new AbortController();
            controller.abort();
            await expect(removeDocumentIds(instance, ['a', 'b'], controller.signal)).rejects.toThrow();

            // The write session was released on failure, so a fresh session must succeed.
            expect(() => instance.indexWriter.startWriteSession().dispose()).not.toThrow();
        });
    });
});
