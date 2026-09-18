import { generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { SearchDB } from '../../../shared/SearchDB';
import { indexDocuments, makeTestIndexEntry } from '../../../testing/indexHelpers';
import { setupRealSearchLibraryWasm } from '../../../testing/setupRealSearchLibraryWasm';
import { IndexKind, IndexRegistry } from '../../index/IndexRegistry';
import { exportEntries } from '../../index/indexEntriesUtils';
import { readEntryRecency } from './entryRecency';

setupRealSearchLibraryWasm();

describe('readEntryRecency', () => {
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

    // readEntryRecency must be called on the Entry while the export's `for await` still holds it -
    // exportEntries frees each Entry as soon as the loop advances past it (see
    // indexEntriesUtils.ts), so holding one across a yield boundary is a use-after-free.
    async function recencyOf(id: string): Promise<number> {
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        for await (const entry of exportEntries(instance, signal)) {
            if (entry.identifier() === id) {
                return readEntryRecency(entry);
            }
        }
        throw new Error(`entry ${id} not found`);
    }

    it('returns the max of the three timestamp attributes', async () => {
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, [
            makeTestIndexEntry('doc-1', {
                creationTime: { kind: 'integer', value: 100n },
                modificationTime: { kind: 'integer', value: 300n },
                activeRevisionCreationTime: { kind: 'integer', value: 200n },
            }),
        ]);

        expect(await recencyOf('doc-1')).toBe(300);
    });

    it('picks activeRevisionCreationTime when it is the most recent', async () => {
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, [
            makeTestIndexEntry('doc-1', {
                creationTime: { kind: 'integer', value: 100n },
                modificationTime: { kind: 'integer', value: 150n },
                activeRevisionCreationTime: { kind: 'integer', value: 999n },
            }),
        ]);

        expect(await recencyOf('doc-1')).toBe(999);
    });

    it('keeps a document whose activeRevisionCreationTime is 0 but modificationTime is recent', async () => {
        // Folders legitimately have activeRevisionCreationTime = 0 (no revision). This is the
        // decisive test that the eviction key takes the max, not the first readable attribute.
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, [
            makeTestIndexEntry('folder-1', {
                creationTime: { kind: 'integer', value: 100n },
                modificationTime: { kind: 'integer', value: 5_000n },
                activeRevisionCreationTime: { kind: 'integer', value: 0n },
            }),
        ]);

        expect(await recencyOf('folder-1')).toBe(5_000);
    });

    it('treats a missing attribute as 0', async () => {
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, [
            makeTestIndexEntry('doc-1', {
                creationTime: { kind: 'integer', value: 42n },
                // modificationTime and activeRevisionCreationTime intentionally omitted.
            }),
        ]);

        expect(await recencyOf('doc-1')).toBe(42);
    });

    it('returns 0 for an entry with none of the three attributes', async () => {
        const instance = await indexRegistry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, [makeTestIndexEntry('doc-1', {})]);

        expect(await recencyOf('doc-1')).toBe(0);
    });
});
