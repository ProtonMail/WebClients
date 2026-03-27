import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { Engine } from '@proton/proton-foundation-search';

import { SearchDB } from '../../shared/SearchDB';
import { InvalidIndexerState } from '../../shared/errors';
import { findTestIndexEntries, makeTestIndexEntry } from '../../testing/indexHelpers';
import { setupRealSearchLibraryWasm } from '../../testing/setupRealSearchLibraryWasm';
import { IndexBlobStore } from './IndexBlobStore';
import { IndexReader } from './IndexReader';
import { IndexKind } from './IndexRegistry';
import { IndexWriter } from './IndexWriter';

setupRealSearchLibraryWasm();

describe('IndexWriter integration', () => {
    let db: SearchDB;
    let engine: ReturnType<typeof Engine.builder.prototype.build>;
    let blobStore: IndexBlobStore;
    let writer: IndexWriter;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        engine = Engine.builder().build();
        blobStore = new IndexBlobStore(IndexKind.MAIN, db);
        writer = new IndexWriter(engine, blobStore);
    });

    afterEach(() => {
        engine.free();
    });

    it('startWriteSession returns a session', () => {
        const session = writer.startWriteSession();
        expect(session).toBeDefined();
        session.dispose();
    });

    it('throws when a second session is started before commit', () => {
        const session = writer.startWriteSession();
        expect(() => writer.startWriteSession()).toThrow(InvalidIndexerState);
        session.dispose();
    });

    it('insert + commit persists blobs to DB', async () => {
        const session = writer.startWriteSession();
        session.insert(makeTestIndexEntry('doc-1'));
        await session.commit();

        const keys = await db.getAllIndexBlobKeys();
        expect(keys.length).toBeGreaterThan(0);
    });

    it('insert + commit makes documents findable via IndexReader', async () => {
        const session = writer.startWriteSession();
        session.insert(makeTestIndexEntry('doc-1'));
        session.insert(makeTestIndexEntry('doc-2'));
        session.insert(makeTestIndexEntry('doc-3'));
        await session.commit();

        const reader = new IndexReader(engine, blobStore);
        const results = await findTestIndexEntries(reader);
        const ids = results.map((r) => r.identifier).sort();
        expect(ids).toEqual(['doc-1', 'doc-2', 'doc-3']);
    });

    it('remove + commit removes document from index', async () => {
        const session1 = writer.startWriteSession();
        session1.insert(makeTestIndexEntry('doc-1'));
        await session1.commit();

        const session = writer.startWriteSession();
        session.remove('doc-1');
        await session.commit();

        const reader = new IndexReader(engine, blobStore);
        const results = await findTestIndexEntries(reader);
        const ids = results.map((r) => r.identifier);
        expect(ids).not.toContain('doc-1');
    });

    it('dispose releases the session lock without committing', () => {
        const session = writer.startWriteSession();
        session.insert(makeTestIndexEntry('doc-1'));
        session.dispose();

        // Should be able to start a new session
        const session2 = writer.startWriteSession();
        expect(session2).toBeDefined();
        session2.dispose();
    });

    it('insert after dispose throws InvalidIndexerState', () => {
        const session = writer.startWriteSession();
        session.dispose();
        expect(() => session.insert(makeTestIndexEntry('doc-1'))).toThrow(InvalidIndexerState);
    });

    it('commit after dispose throws InvalidIndexerState', async () => {
        const session = writer.startWriteSession();
        session.dispose();
        await expect(session.commit()).rejects.toThrow(InvalidIndexerState);
    });
});
