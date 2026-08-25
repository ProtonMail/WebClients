import { generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { Cached, Engine, Expression, Func, TermValue } from '@proton/proton-foundation-search';

import { SearchDB } from '../../shared/SearchDB';
import { SEARCH_BLOB_CACHE_MAX_ENTRIES } from '../../shared/config';
import { SearchBlobCryptoError, SearchLibraryError, classifyError, isRepairableError } from '../../shared/errors';
import { findTestIndexEntries, indexDocuments, makeTestIndexEntry } from '../../testing/indexHelpers';
import { setupRealSearchLibraryWasm } from '../../testing/setupRealSearchLibraryWasm';
import { IndexBlobStore } from './IndexBlobStore';
import { IndexReader } from './IndexReader';
import { IndexKind } from './IndexRegistry';
import { IndexWriter } from './IndexWriter';

setupRealSearchLibraryWasm();

describe('IndexBlobStore crypto failures', () => {
    let db: SearchDB;
    let engine: ReturnType<typeof Engine.builder.prototype.build>;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        engine = Engine.builder().build();
    });

    afterEach(() => {
        engine.free();
    });

    const expectBlobCryptoError = (error: unknown) => {
        expect(error).toBeInstanceOf(SearchBlobCryptoError);
        // Deliberately NOT search_library_error: the engine is fine, the local data is not, and
        // that bucket is our signal for real WASM faults.
        expect(error).not.toBeInstanceOf(SearchLibraryError);
        expect(classifyError(error)).toEqual({ kind: 'permanent', reason: 'search_crypto_error' });
        expect(isRepairableError(error)).toBe(false);
    };

    it('a blob that will not decrypt surfaces as a permanent search_crypto_error', async () => {
        // Write blobs under one key, then read them back under another. Real AES-GCM, so this is a
        // genuine auth-tag mismatch rather than a stubbed rejection.
        const writeKey = await generateAndImportKey();
        const writer = new IndexWriter(engine, new IndexBlobStore(IndexKind.MAIN, db, writeKey), async () => {});
        await indexDocuments(writer, [makeTestIndexEntry('doc-1')]);

        const readKey = await generateAndImportKey();
        const freshEngine = Engine.builder().build();
        try {
            const reader = new IndexReader(freshEngine, new IndexBlobStore(IndexKind.MAIN, db, readKey));
            const error = await findTestIndexEntries(reader).catch((e: unknown) => e);

            expectBlobCryptoError(error);
        } finally {
            freshEngine.free();
        }
    });

    it('a blob that will not encrypt surfaces as a permanent search_crypto_error', async () => {
        // A decrypt-only key makes WebCrypto reject on encrypt. This also guards the async/await
        // inside putEncryptedIndexBlob's callback: with a bare `return`, the rejection would skip
        // the SearchBlobCryptoError wrap and land as a generic SearchLibraryError instead.
        const decryptOnlyKey = await generateAndImportKey(['decrypt']);
        const writer = new IndexWriter(engine, new IndexBlobStore(IndexKind.MAIN, db, decryptOnlyKey), async () => {});

        const error = await indexDocuments(writer, [makeTestIndexEntry('doc-1')]).catch((e: unknown) => e);

        expectBlobCryptoError(error);
    });

    it('round-trips normally when the same key is used', async () => {
        const cryptoKey = await generateAndImportKey();
        const blobStore = new IndexBlobStore(IndexKind.MAIN, db, cryptoKey);
        const writer = new IndexWriter(engine, blobStore, async () => {});
        await indexDocuments(writer, [makeTestIndexEntry('doc-1')]);

        const reader = new IndexReader(engine, blobStore);
        expect((await findTestIndexEntries(reader)).map((r) => r.identifier)).toContain('doc-1');
    });
});

describe('IndexBlobStore read-through caching', () => {
    let db: SearchDB;
    let cryptoKey: CryptoKey;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        cryptoKey = await generateAndImportKey();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('serves a repeated query from cache instead of re-reading and re-decrypting', async () => {
        // Index, then drop the writer's engine and store so the reader starts cold. That is the
        // case this pays for: only saveEvent used to admit blobs, so a worker that has indexed
        // nothing re-read and re-AES-GCM-decrypted the same blobs on every single query.
        const writeEngine = Engine.builder().build();
        try {
            await indexDocuments(
                new IndexWriter(writeEngine, new IndexBlobStore(IndexKind.MAIN, db, cryptoKey), async () => {}),
                [makeTestIndexEntry('doc-1')]
            );
        } finally {
            writeEngine.free();
        }

        const engine = Engine.builder().build();
        try {
            const reader = new IndexReader(engine, new IndexBlobStore(IndexKind.MAIN, db, cryptoKey));
            const dbReads = jest.spyOn(db, 'getDecryptedIndexBlob');

            expect((await findTestIndexEntries(reader)).map((r) => r.identifier)).toContain('doc-1');
            expect(dbReads).toHaveBeenCalled();

            dbReads.mockClear();
            expect((await findTestIndexEntries(reader)).map((r) => r.identifier)).toContain('doc-1');
            expect(dbReads).not.toHaveBeenCalled();
        } finally {
            engine.free();
        }
    });

    it('never admits a missing blob, so absence is not served from cache', async () => {
        // Admitting sendEmpty() would report the blob as present-but-empty from then on, masking
        // exactly the storage corruption the engine surfaces by refusing sendEmpty() on a required
        // blob. An absent blob must therefore be re-read from storage every time.
        const engine = Engine.builder().build();
        try {
            const reader = new IndexReader(engine, new IndexBlobStore(IndexKind.MAIN, db, cryptoKey));
            const dbReads = jest.spyOn(db, 'getDecryptedIndexBlob');

            await findTestIndexEntries(reader);
            expect(dbReads).toHaveBeenCalled();

            dbReads.mockClear();
            await findTestIndexEntries(reader);
            expect(dbReads).toHaveBeenCalled();
        } finally {
            engine.free();
        }
    });

    it('a freshly saved blob is already warm - a same-store read touches the DB zero times', async () => {
        // saveEvent's own admit() already populated the cache, so a read of the very same blob
        // right after should never fall through to loadEvent's DB path at all. Spy attached AFTER
        // indexing: the very first commit against an empty index unavoidably does one real miss
        // (loading the not-yet-existing manifest before it can save one), which is a write-side
        // cost this test isn't about.
        const engine = Engine.builder().build();
        try {
            const blobStore = new IndexBlobStore(IndexKind.MAIN, db, cryptoKey);
            const writer = new IndexWriter(engine, blobStore, async () => {});

            await indexDocuments(writer, [makeTestIndexEntry('doc-1')]);

            const dbReads = jest.spyOn(db, 'getDecryptedIndexBlob');
            const reader = new IndexReader(engine, blobStore);
            expect((await findTestIndexEntries(reader)).map((r) => r.identifier)).toContain('doc-1');
            expect(dbReads).not.toHaveBeenCalled();
        } finally {
            engine.free();
        }
    });

    it('caches every distinct blob touched by a cold read, not just the first one', async () => {
        const writeEngine = Engine.builder().build();
        try {
            await indexDocuments(
                new IndexWriter(writeEngine, new IndexBlobStore(IndexKind.MAIN, db, cryptoKey), async () => {}),
                [makeTestIndexEntry('doc-1'), makeTestIndexEntry('doc-2'), makeTestIndexEntry('doc-3')]
            );
        } finally {
            writeEngine.free();
        }

        const engine = Engine.builder().build();
        try {
            const reader = new IndexReader(engine, new IndexBlobStore(IndexKind.MAIN, db, cryptoKey));
            const dbReads = jest.spyOn(db, 'getDecryptedIndexBlob');

            const first = (await findTestIndexEntries(reader)).map((r) => r.identifier);
            expect(first).toEqual(expect.arrayContaining(['doc-1', 'doc-2', 'doc-3']));
            expect(dbReads).toHaveBeenCalled();

            dbReads.mockClear();
            const second = (await findTestIndexEntries(reader)).map((r) => r.identifier);
            expect(second).toEqual(expect.arrayContaining(['doc-1', 'doc-2', 'doc-3']));
            expect(dbReads).not.toHaveBeenCalled();
        } finally {
            engine.free();
        }
    });

    it('read-triggered admission respects the capacity bound and still returns correct results', async () => {
        // Every prior eviction/capacity test only ever exercised saveEvent's admit() call. Proving
        // the same is true for loadEvent's admit() call needs more distinct live blobs in a single
        // query's working set than the real 20-entry cap - and a query genuinely does not need
        // that many (measured: one query touches ~3 distinct blobs regardless of how much indexing
        // history exists, since only the current generation is live). So the cap is shrunk here via
        // module mocking + a fresh dynamic import, which is a fair test of the mechanism: the same
        // small, real working set now exceeds a smaller bound.
        jest.doMock('../../shared/config', () => ({
            ...jest.requireActual('../../shared/config'),
            SEARCH_BLOB_CACHE_MAX_ENTRIES: 2,
        }));
        jest.resetModules();
        const { IndexBlobStore: TinyCapIndexBlobStore } = await import('./IndexBlobStore');

        const writeEngine = Engine.builder().build();
        try {
            const writer = new IndexWriter(
                writeEngine,
                new TinyCapIndexBlobStore(IndexKind.MAIN, db, cryptoKey),
                async () => {}
            );
            await indexDocuments(writer, [
                makeTestIndexEntry('doc-1'),
                makeTestIndexEntry('doc-2'),
                makeTestIndexEntry('doc-3'),
            ]);
        } finally {
            writeEngine.free();
        }

        const engine = Engine.builder().build();
        try {
            const reader = new IndexReader(engine, new TinyCapIndexBlobStore(IndexKind.MAIN, db, cryptoKey));
            const freeSpy = jest.spyOn(Cached.prototype, 'free');

            const identifiers = (await findTestIndexEntries(reader)).map((r) => r.identifier);
            expect(identifiers).toEqual(expect.arrayContaining(['doc-1', 'doc-2', 'doc-3']));
            expect(freeSpy).toHaveBeenCalled();
        } finally {
            engine.free();
            jest.dontMock('../../shared/config');
            jest.resetModules();
        }
    });

    it('disposeAll() frees blobs admitted via a read, not only ones admitted via a save', async () => {
        const writeEngine = Engine.builder().build();
        try {
            await indexDocuments(
                new IndexWriter(writeEngine, new IndexBlobStore(IndexKind.MAIN, db, cryptoKey), async () => {}),
                [makeTestIndexEntry('doc-1')]
            );
        } finally {
            writeEngine.free();
        }

        const engine = Engine.builder().build();
        try {
            const blobStore = new IndexBlobStore(IndexKind.MAIN, db, cryptoKey);
            const reader = new IndexReader(engine, blobStore);
            await findTestIndexEntries(reader);

            const freeSpy = jest.spyOn(Cached.prototype, 'free');
            blobStore.disposeAll();
            expect(freeSpy).toHaveBeenCalled();
        } finally {
            engine.free();
        }
    });
});

describe('IndexBlobStore concurrent reads and writes', () => {
    let db: SearchDB;
    let cryptoKey: CryptoKey;

    // findTestIndexEntries collects the whole generator via collectResults, which is unusable here
    // - the entire point of these tests is to pause mid-consumption. Same tag filter, driven by
    // hand instead.
    const queryTestEntries = (reader: IndexReader) =>
        reader.execute((q) => q.withStructuredExpression(Expression.attr('test', Func.Equals, TermValue.text('test'))));

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        cryptoKey = await generateAndImportKey();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('defers an eviction from a write that lands while a query is still being consumed', async () => {
        const engine = Engine.builder().build();
        try {
            const blobStore = new IndexBlobStore(IndexKind.MAIN, db, cryptoKey);
            const writer = new IndexWriter(engine, blobStore, async () => {});
            // At least two results, so the generator still has work left after the first yield -
            // beginRead() has fired but endRead() has not, matching a client mid-way through
            // streaming search results.
            await indexDocuments(writer, [makeTestIndexEntry('doc-1'), makeTestIndexEntry('doc-2')]);

            const reader = new IndexReader(engine, blobStore);
            const generator = queryTestEntries(reader);
            const firstResult = await generator.next();
            expect(firstResult.done).toBe(false);

            const freeSpy = jest.spyOn(Cached.prototype, 'free');
            // A write lands on the same engine/store while the caller above hasn't finished
            // consuming the earlier query.
            await indexDocuments(writer, [makeTestIndexEntry('doc-3')]);
            expect(freeSpy).not.toHaveBeenCalled();

            // Draining the rest of the query is what fires endRead() and releases the deferral.
            let next = await generator.next();
            while (!next.done) {
                next = await generator.next();
            }
            expect(freeSpy).toHaveBeenCalled();
        } finally {
            engine.free();
        }
    });

    it('a write completing entirely during an open read does not corrupt either side', async () => {
        const engine = Engine.builder().build();
        try {
            const blobStore = new IndexBlobStore(IndexKind.MAIN, db, cryptoKey);
            const writer = new IndexWriter(engine, blobStore, async () => {});
            await indexDocuments(writer, [makeTestIndexEntry('doc-1'), makeTestIndexEntry('doc-2')]);

            const reader = new IndexReader(engine, blobStore);
            const generator = queryTestEntries(reader);
            const results: string[] = [];
            const first = await generator.next();
            if (!first.done) {
                results.push(first.value.identifier);
            }

            await indexDocuments(writer, [makeTestIndexEntry('doc-3')]);

            let next = await generator.next();
            while (!next.done) {
                results.push(next.value.identifier);
                next = await generator.next();
            }

            // The in-flight query is a snapshot - whether it also happens to observe doc-3 isn't
            // the point. What matters: it isn't missing doc-1/doc-2, and a fresh query afterward
            // sees all three - the interleaved write corrupted neither side.
            expect(results).toEqual(expect.arrayContaining(['doc-1', 'doc-2']));
            expect((await findTestIndexEntries(reader)).map((r) => r.identifier)).toEqual(
                expect.arrayContaining(['doc-1', 'doc-2', 'doc-3'])
            );
        } finally {
            engine.free();
        }
    });

    it('an overlapping outer write window only drains once every nested window has ended', async () => {
        // Models CleanUpStaleBlobsTask's own beginWrite/endWrite bracket overlapping with an
        // ordinary indexing commit's - both share the same activeWriteCount, so ending the inner
        // one (the commit) must not drain while the outer one (standing in for cleanup) is still
        // open, and vice versa.
        const engine = Engine.builder().build();
        try {
            const blobStore = new IndexBlobStore(IndexKind.MAIN, db, cryptoKey);
            const writer = new IndexWriter(engine, blobStore, async () => {});
            for (let i = 0; i < SEARCH_BLOB_CACHE_MAX_ENTRIES; i++) {
                await indexDocuments(writer, [makeTestIndexEntry(`doc-${i}`)]);
            }

            const freeSpy = jest.spyOn(Cached.prototype, 'free');
            blobStore.beginWrite(); // outer window opens (e.g. CleanUpStaleBlobsTask)
            await indexDocuments(writer, [makeTestIndexEntry('overflow')]); // inner window opens+closes
            expect(freeSpy).not.toHaveBeenCalled(); // outer window still open

            blobStore.endWrite(); // outer window closes
            expect(freeSpy).toHaveBeenCalled();
        } finally {
            engine.free();
        }
    });
});

describe('IndexBlobStore cache bounds', () => {
    let db: SearchDB;
    let engine: ReturnType<typeof Engine.builder.prototype.build>;
    let blobStore: IndexBlobStore;
    let writer: IndexWriter;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        engine = Engine.builder().build();
        const cryptoKey = await generateAndImportKey();
        blobStore = new IndexBlobStore(IndexKind.MAIN, db, cryptoKey);
        writer = new IndexWriter(engine, blobStore, async () => {});
    });

    afterEach(() => {
        engine.free();
        jest.restoreAllMocks();
    });

    it('consults Cached.priority() when evicting past capacity, not just recency', async () => {
        const prioritySpy = jest.spyOn(Cached.prototype, 'priority');

        for (let i = 0; i < SEARCH_BLOB_CACHE_MAX_ENTRIES + 5; i++) {
            await indexDocuments(writer, [makeTestIndexEntry(`doc-${i}`)]);
        }

        expect(prioritySpy).toHaveBeenCalled();
    });

    it('stays within the configured bound across many commits, freeing evicted blobs', async () => {
        const freeSpy = jest.spyOn(Cached.prototype, 'free');

        for (let i = 0; i < SEARCH_BLOB_CACHE_MAX_ENTRIES + 50; i++) {
            await indexDocuments(writer, [makeTestIndexEntry(`doc-${i}`)]);
        }

        expect(freeSpy).toHaveBeenCalled();

        // An early, now-evicted document's blob is gone from the in-memory cache but still
        // findable - a cache miss falls back to IndexedDB, no data loss.
        const reader = new IndexReader(engine, blobStore);
        expect((await findTestIndexEntries(reader)).map((r) => r.identifier)).toContain('doc-0');
    });

    it('frees the previous Cached when a blob key is resaved under the same name', async () => {
        // Far below the eviction bound, so any free() observed here can only come from the
        // same-key-overwrite path in saveEvent, not LRU capacity eviction.
        await indexDocuments(writer, [makeTestIndexEntry('doc-1')]);

        const freeSpy = jest.spyOn(Cached.prototype, 'free');
        await indexDocuments(writer, [makeTestIndexEntry('doc-2')]);

        expect(freeSpy).toHaveBeenCalled();
    });

    it('defers freeing while a read is in flight, then flushes once it ends', async () => {
        for (let i = 0; i < SEARCH_BLOB_CACHE_MAX_ENTRIES; i++) {
            await indexDocuments(writer, [makeTestIndexEntry(`doc-${i}`)]);
        }

        const freeSpy = jest.spyOn(Cached.prototype, 'free');
        blobStore.beginRead();
        for (let i = SEARCH_BLOB_CACHE_MAX_ENTRIES; i < SEARCH_BLOB_CACHE_MAX_ENTRIES + 50; i++) {
            await indexDocuments(writer, [makeTestIndexEntry(`doc-${i}`)]);
        }
        expect(freeSpy).not.toHaveBeenCalled();

        blobStore.endRead();
        expect(freeSpy).toHaveBeenCalled();
    });

    it('round-trips a many-entry single commit', async () => {
        // Note this deliberately does NOT exercise the capacity bound: blob count is driven by
        // segments per commit (~6), not by entry count, so one commit of any size stays well under
        // the cap. It guards the bulk-insert path itself, nothing about eviction.
        const session = writer.startWriteSession();
        const entryCount = SEARCH_BLOB_CACHE_MAX_ENTRIES + 50;
        for (let i = 0; i < entryCount; i++) {
            session.insert({
                documentId: `bulk-${i}`,
                attributes: [{ name: 'test', value: { kind: 'tag', value: 'test' } }],
            });
        }
        await session.commit();

        const reader = new IndexReader(engine, blobStore);
        const identifiers = (await findTestIndexEntries(reader)).map((r) => r.identifier);
        expect(identifiers).toContain('bulk-0');
        expect(identifiers).toContain(`bulk-${entryCount - 1}`);
    });

    it('drains deferred frees at the end of the commit that queued them', async () => {
        // Every eviction is deferred while a commit is in flight (saveEvent runs inside the commit
        // loop), so endWrite() is the only thing that ever releases them on the write path.
        for (let i = 0; i < SEARCH_BLOB_CACHE_MAX_ENTRIES; i++) {
            await indexDocuments(writer, [makeTestIndexEntry(`doc-${i}`)]);
        }

        const freeSpy = jest.spyOn(Cached.prototype, 'free');
        await indexDocuments(writer, [makeTestIndexEntry('overflow')]);

        expect(freeSpy).toHaveBeenCalled();
    });

    it('getCacheStats reports live entry count within the bound, and pending frees', async () => {
        expect(blobStore.getCacheStats()).toEqual({
            blobsCount: 0,
            pendingFreeBlobsCount: 0,
            blobSizesInMb: [],
        });

        for (let i = 0; i < SEARCH_BLOB_CACHE_MAX_ENTRIES + 50; i++) {
            await indexDocuments(writer, [makeTestIndexEntry(`doc-${i}`)]);
        }

        const warmStats = blobStore.getCacheStats();
        expect(warmStats.blobsCount).toBeGreaterThan(0);
        expect(warmStats.blobsCount).toBeLessThanOrEqual(SEARCH_BLOB_CACHE_MAX_ENTRIES);
        expect(warmStats.pendingFreeBlobsCount).toBe(0);
        expect(warmStats.blobSizesInMb).toHaveLength(warmStats.blobsCount);
        // Rounded to 3 decimals, so a blob under ~500 bytes legitimately rounds down to 0.
        expect(warmStats.blobSizesInMb.every((mb) => mb >= 0)).toBe(true);

        blobStore.beginRead();
        await indexDocuments(writer, [makeTestIndexEntry('doc-extra')]);
        expect(blobStore.getCacheStats().pendingFreeBlobsCount).toBeGreaterThan(0);
        blobStore.endRead();
        expect(blobStore.getCacheStats().pendingFreeBlobsCount).toBe(0);
    });

    it('getCacheStats orders blobSizesInMb by priority, highest priority first, rounded to 3 decimals', async () => {
        // Real writes produce more than one Cached.priority() tier (baseline 0, token-bucket
        // occurrences 42 - see Cached.priority() docs), so a single commit already gives us a mix.
        await indexDocuments(writer, [makeTestIndexEntry('doc-1')]);

        const prioritySpy = jest.spyOn(Cached.prototype, 'priority');
        const serializeSpy = jest.spyOn(Cached.prototype, 'serialize');

        const stats = blobStore.getCacheStats();

        // getCacheStats() reads priority() then serialize() once per live entry, in the same
        // iteration - zip the two spies back together by call order to get each entry's
        // (priority, sizeMb) pair independently of the function's own sort.
        const priorities = prioritySpy.mock.results.map((r) => r.value as number);
        const sizesMb = serializeSpy.mock.results.map(
            (r) => Math.round(((r.value as Uint8Array<ArrayBuffer>).byteLength / 1024 / 1024) * 1000) / 1000
        );
        expect(new Set(priorities).size).toBeGreaterThan(1);

        const expectedOrder = priorities
            .map((priority, i) => ({ priority, sizeMb: sizesMb[i] }))
            .sort((a, b) => a.priority - b.priority)
            .map((e) => e.sizeMb);

        expect(stats.blobSizesInMb).toEqual(expectedOrder);
    });
});

describe('IndexBlobStore free() failures', () => {
    let db: SearchDB;
    let engine: ReturnType<typeof Engine.builder.prototype.build>;
    let blobStore: IndexBlobStore;
    let writer: IndexWriter;

    // A throwing .free() must never mask the real operation (save/release/dispose) or leave the
    // cache in a broken state - see bug_wasm_writer_free_masks_error_and_leaks_lock. Call through
    // to the real free() first, then throw, so the WASM object is actually destroyed and later
    // operations in the same test aren't corrupted by a half-freed handle.
    const makeFreeThrow = () => {
        const originalFree = Cached.prototype.free;
        return jest.spyOn(Cached.prototype, 'free').mockImplementation(function (this: Cached) {
            originalFree.call(this);
            throw new Error('attempted to take ownership of Rust value while it was borrowed');
        });
    };

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        engine = Engine.builder().build();
        const cryptoKey = await generateAndImportKey();
        blobStore = new IndexBlobStore(IndexKind.MAIN, db, cryptoKey);
        writer = new IndexWriter(engine, blobStore, async () => {});
    });

    afterEach(() => {
        engine.free();
        jest.restoreAllMocks();
    });

    it('keeps indexing correctly when freeing an evicted entry throws', async () => {
        makeFreeThrow();

        for (let i = 0; i < SEARCH_BLOB_CACHE_MAX_ENTRIES + 5; i++) {
            await indexDocuments(writer, [makeTestIndexEntry(`doc-${i}`)]);
        }

        // Evicted-and-failed-to-free blobs still fall back to IndexedDB correctly - a broken
        // free() must not corrupt the cache or block subsequent saves.
        const reader = new IndexReader(engine, blobStore);
        expect((await findTestIndexEntries(reader)).map((r) => r.identifier)).toContain('doc-0');
    });

    it('does not throw when freeing a superseded blob on overwrite fails', async () => {
        await indexDocuments(writer, [makeTestIndexEntry('doc-1')]);

        makeFreeThrow();

        await expect(indexDocuments(writer, [makeTestIndexEntry('doc-2')])).resolves.toBeUndefined();
    });

    it('defers a failing free() the same as a successful one while a read is in flight', async () => {
        for (let i = 0; i < SEARCH_BLOB_CACHE_MAX_ENTRIES; i++) {
            await indexDocuments(writer, [makeTestIndexEntry(`doc-${i}`)]);
        }

        const freeSpy = makeFreeThrow();
        blobStore.beginRead();
        await expect(
            indexDocuments(writer, [makeTestIndexEntry(`doc-${SEARCH_BLOB_CACHE_MAX_ENTRIES}`)])
        ).resolves.toBeUndefined();
        expect(freeSpy).not.toHaveBeenCalled();

        // Draining on endRead() must not throw even though every deferred free() fails.
        expect(() => blobStore.endRead()).not.toThrow();
        expect(freeSpy).toHaveBeenCalled();
    });

    it('a throwing priority() does not fail the save that triggered eviction', async () => {
        for (let i = 0; i < SEARCH_BLOB_CACHE_MAX_ENTRIES + 2; i++) {
            await indexDocuments(writer, [makeTestIndexEntry(`doc-${i}`)]);
        }

        // priority() is only an eviction hint. Letting it throw would fail a save whose blob is
        // already durably written, and the indexer treats that as permanent - it stops entirely.
        jest.spyOn(Cached.prototype, 'priority').mockImplementation(() => {
            throw new Error('null pointer passed to rust');
        });

        await expect(indexDocuments(writer, [makeTestIndexEntry('doc-after')])).resolves.toBeUndefined();
    });

    it('disposeAll() frees deferred blobs instead of dropping them', async () => {
        for (let i = 0; i < SEARCH_BLOB_CACHE_MAX_ENTRIES + 5; i++) {
            await indexDocuments(writer, [makeTestIndexEntry(`doc-${i}`)]);
        }

        // Go busy so the evictions from these commits queue up rather than being freed.
        blobStore.beginRead();
        for (let i = 0; i < 5; i++) {
            await indexDocuments(writer, [makeTestIndexEntry(`deferred-${i}`)]);
        }

        const freeSpy = jest.spyOn(Cached.prototype, 'free');
        blobStore.disposeAll();
        const freedByDispose = freeSpy.mock.calls.length;

        // Teardown is the last chance to release the deferred ones: if disposeAll just dropped the
        // queue, this later drain would be the only place they could still be freed - and it finds
        // nothing, meaning they leaked.
        blobStore.endRead();
        expect(freeSpy.mock.calls.length - freedByDispose).toBe(0);
        expect(freedByDispose).toBeGreaterThan(SEARCH_BLOB_CACHE_MAX_ENTRIES);
    });

    it('disposeAll() clears the cache and attempts every entry even when every free() throws', async () => {
        await indexDocuments(writer, [makeTestIndexEntry('doc-1')]);
        await indexDocuments(writer, [makeTestIndexEntry('doc-2')]);

        const freeSpy = makeFreeThrow();

        expect(() => blobStore.disposeAll()).not.toThrow();
        // At least the two commits' distinct segment blobs were resident - each still gets a
        // free() attempt despite every single one throwing.
        expect(freeSpy.mock.calls.length).toBeGreaterThan(1);
    });
});
