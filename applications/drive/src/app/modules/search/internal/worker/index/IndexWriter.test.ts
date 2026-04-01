import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { Engine, Execution, Write, WriteEvent } from '@proton/proton-foundation-search';

import { SearchDB } from '../../shared/SearchDB';
import { InvalidIndexerState, SearchLibraryError } from '../../shared/errors';
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
        jest.restoreAllMocks();
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

    it('dispose frees the WASM writer handle (no use-after-free on next session)', () => {
        const session1 = writer.startWriteSession();
        session1.insert(makeTestIndexEntry('doc-1'));
        session1.dispose();

        // A new session should work without WASM errors from a leaked handle
        const session2 = writer.startWriteSession();
        session2.insert(makeTestIndexEntry('doc-2'));
        session2.dispose();
    });

    it('commit frees the WASM writer and execution handles', async () => {
        const session = writer.startWriteSession();
        session.insert(makeTestIndexEntry('doc-1'));
        await session.commit();

        // Starting a new session should not throw — the previous handles are fully released
        const session2 = writer.startWriteSession();
        session2.insert(makeTestIndexEntry('doc-2'));
        await session2.commit();
    });

    it('multiple insert-commit cycles do not leak WASM handles', async () => {
        for (let i = 0; i < 10; i++) {
            const session = writer.startWriteSession();
            session.insert(makeTestIndexEntry(`doc-${i}`));
            await session.commit();
        }

        const reader = new IndexReader(engine, blobStore);
        const results = await findTestIndexEntries(reader);
        expect(results).toHaveLength(10);
    });

    it('dispose after failed insert still releases the session lock', () => {
        const session = writer.startWriteSession();
        session.dispose();

        // insert on a disposed session throws, but the lock is released
        expect(() => session.insert(makeTestIndexEntry('doc-1'))).toThrow(InvalidIndexerState);

        // A new session can be started
        const session2 = writer.startWriteSession();
        expect(session2).toBeDefined();
        session2.dispose();
    });

    describe('WASM resource cleanup', () => {
        it('commit calls blobStore.saveEvent for each Save event', async () => {
            const saveSpy = jest.spyOn(blobStore, 'saveEvent');

            const session = writer.startWriteSession();
            session.insert(makeTestIndexEntry('doc-1'));
            await session.commit();

            expect(saveSpy.mock.calls.length).toBeGreaterThan(0);
        });

        it('commit calls blobStore.loadEvent when engine has existing blobs', async () => {
            // First commit creates blobs
            const session1 = writer.startWriteSession();
            session1.insert(makeTestIndexEntry('doc-1'));
            await session1.commit();

            const loadSpy = jest.spyOn(blobStore, 'loadEvent');

            // Second commit may trigger Load events to read existing blobs
            const session2 = writer.startWriteSession();
            session2.insert(makeTestIndexEntry('doc-2'));
            await session2.commit();

            expect(loadSpy.mock.calls.length).toBeGreaterThan(0);
        });

        it('commit releases session lock even when blobStore.saveEvent throws', async () => {
            jest.spyOn(blobStore, 'saveEvent').mockRejectedValueOnce(new Error('disk full'));

            const session = writer.startWriteSession();
            session.insert(makeTestIndexEntry('doc-1'));
            await expect(session.commit()).rejects.toThrow('disk full');

            // Lock must be released — a new session should work
            const session2 = writer.startWriteSession();
            expect(session2).toBeDefined();
            session2.dispose();
        });

        it('commit releases session lock even when blobStore.loadEvent throws', async () => {
            // First commit to create blobs
            const session1 = writer.startWriteSession();
            session1.insert(makeTestIndexEntry('doc-1'));
            await session1.commit();

            jest.spyOn(blobStore, 'loadEvent').mockRejectedValueOnce(new Error('read error'));

            const session2 = writer.startWriteSession();
            session2.insert(makeTestIndexEntry('doc-2'));
            await expect(session2.commit()).rejects.toThrow('read error');

            // Lock must be released
            const session3 = writer.startWriteSession();
            expect(session3).toBeDefined();
            session3.dispose();
        });

        it('dispose is idempotent — calling it twice does not throw', () => {
            const session = writer.startWriteSession();
            session.dispose();
            session.dispose(); // should be a no-op
        });

        it('read after write-commit cycle works without WASM borrow errors', async () => {
            const session = writer.startWriteSession();
            session.insert(makeTestIndexEntry('doc-1', { filename: { kind: 'text', value: 'test file' } }));
            await session.commit();

            // This is the critical path: reading from the same engine after a write+commit
            // previously caused "attempted to take ownership while it was borrowed"
            const reader = new IndexReader(engine, blobStore);
            const results = await findTestIndexEntries(reader);
            expect(results).toHaveLength(1);
            expect(results[0].identifier).toBe('doc-1');
        });

        it('interleaved write-commit and read cycles do not corrupt engine state', async () => {
            for (let i = 0; i < 5; i++) {
                const session = writer.startWriteSession();
                session.insert(makeTestIndexEntry(`doc-${i}`, { filename: { kind: 'text', value: `file ${i}` } }));
                await session.commit();

                // Read after each commit
                const reader = new IndexReader(engine, blobStore);
                const results = await findTestIndexEntries(reader);
                expect(results).toHaveLength(i + 1);
            }
        });

        it('commit calls Execution.free()', async () => {
            const freeSpy = jest.spyOn(Execution.prototype, 'free');

            const session = writer.startWriteSession();
            session.insert(makeTestIndexEntry('doc-1'));
            await session.commit();

            expect(freeSpy).toHaveBeenCalledTimes(1);
        });

        it('commit only calls WriteEvent.free() for Stats events, not Load/Save', async () => {
            const writeEventFreeSpy = jest.spyOn(WriteEvent.prototype, 'free');
            const saveSpy = jest.spyOn(blobStore, 'saveEvent');

            const session = writer.startWriteSession();
            session.insert(makeTestIndexEntry('doc-1'));
            await session.commit();

            // Load/Save events are consumed via __destroy_into_raw (send/recv).
            // Only Stats events use explicit .free(). Verify free() is called fewer
            // times than there are total events (save + load + stats).
            const saveCallCount = saveSpy.mock.calls.length;
            expect(saveCallCount).toBeGreaterThan(0);
            expect(writeEventFreeSpy.mock.calls.length).toBeLessThan(saveCallCount);
        });

        it('dispose calls Write.free()', () => {
            const freeSpy = jest.spyOn(Write.prototype, 'free');

            const session = writer.startWriteSession();
            session.insert(makeTestIndexEntry('doc-1'));
            session.dispose();

            expect(freeSpy).toHaveBeenCalledTimes(1);
        });

        it('commit calls Execution.free() even when blobStore throws', async () => {
            const freeSpy = jest.spyOn(Execution.prototype, 'free');
            jest.spyOn(blobStore, 'saveEvent').mockRejectedValueOnce(new Error('boom'));

            const session = writer.startWriteSession();
            session.insert(makeTestIndexEntry('doc-1'));
            await expect(session.commit()).rejects.toThrow('boom');

            expect(freeSpy).toHaveBeenCalledTimes(1);
        });

        it('when writer.commit() throws, Write.free() is called and session lock is released', async () => {
            const writeFreeSpy = jest.spyOn(Write.prototype, 'free');
            // Make the WASM commit() throw after the session is created
            jest.spyOn(Write.prototype, 'commit').mockImplementationOnce(() => {
                throw new Error('WASM commit failed');
            });

            const session = writer.startWriteSession();
            session.insert(makeTestIndexEntry('doc-1'));
            await expect(session.commit()).rejects.toThrow(SearchLibraryError);

            // Writer handle must be freed on commit failure
            expect(writeFreeSpy).toHaveBeenCalledTimes(1);

            // Session lock must be released — new session should work
            const session2 = writer.startWriteSession();
            expect(session2).toBeDefined();
            session2.dispose();
        });

        it('when writer.commit() throws, Execution.free() is not called (no execution created)', async () => {
            const executionFreeSpy = jest.spyOn(Execution.prototype, 'free');
            jest.spyOn(Write.prototype, 'commit').mockImplementationOnce(() => {
                throw new Error('WASM commit failed');
            });

            const session = writer.startWriteSession();
            session.insert(makeTestIndexEntry('doc-1'));
            await expect(session.commit()).rejects.toThrow(SearchLibraryError);

            // No Execution was created, so its free() should not be called
            expect(executionFreeSpy).not.toHaveBeenCalled();
        });
    });
});
