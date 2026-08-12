import { generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { Engine, Expression, Func, TermValue } from '@proton/proton-foundation-search';

import { SearchDB } from '../../shared/SearchDB';
import { SearchLibraryError, classifyError, isRepairableError } from '../../shared/errors';
import { collectResults, indexDocuments, makeTestIndexEntry } from '../../testing/indexHelpers';
import { setupRealSearchLibraryWasm } from '../../testing/setupRealSearchLibraryWasm';
import { IndexBlobStore } from './IndexBlobStore';
import { IndexReader } from './IndexReader';
import { IndexKind } from './IndexRegistry';
import { IndexWriter } from './IndexWriter';

setupRealSearchLibraryWasm();

describe('IndexReader integration', () => {
    let db: SearchDB;
    let engine: ReturnType<typeof Engine.builder.prototype.build>;
    let blobStore: IndexBlobStore;
    let writer: IndexWriter;
    let reader: IndexReader;

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        engine = Engine.builder().build();
        const cryptoKey = await generateAndImportKey();
        blobStore = new IndexBlobStore(IndexKind.MAIN, db, cryptoKey);
        writer = new IndexWriter(engine, blobStore);
        reader = new IndexReader(engine, blobStore);
    });

    afterEach(() => {
        engine.free();
    });

    const searchByFilename = (term: string) =>
        reader.execute((q) =>
            q.withStructuredExpression(Expression.attr('filename', Func.Matches, TermValue.text(term).wildcard()))
        );

    it('returns empty results for an empty index', async () => {
        const results = await collectResults(reader.execute((q) => q));
        expect(results).toHaveLength(0);
    });

    it('returns matching documents after indexing', async () => {
        await indexDocuments(writer, [
            makeTestIndexEntry('doc-1', { filename: { kind: 'text', value: 'quarterly report' } }),
            makeTestIndexEntry('doc-2', { filename: { kind: 'text', value: 'meeting notes' } }),
            makeTestIndexEntry('doc-3', { filename: { kind: 'text', value: 'annual report 2024' } }),
        ]);

        const results = await collectResults(searchByFilename('report'));
        const ids = results.map((r) => r.identifier);
        expect(ids).toContain('doc-1');
        expect(ids).toContain('doc-3');
        expect(ids).not.toContain('doc-2');
    });

    it('result has identifier and score', async () => {
        await indexDocuments(writer, [makeTestIndexEntry('doc-1', { filename: { kind: 'text', value: 'test file' } })]);

        const results = await collectResults(searchByFilename('test'));
        expect(results).toHaveLength(1);
        expect(results[0].identifier).toBe('doc-1');
        expect(typeof results[0].score).toBe('number');
    });

    it('returns no results for non-matching query', async () => {
        await indexDocuments(writer, [
            makeTestIndexEntry('doc-1', { filename: { kind: 'text', value: 'hello world' } }),
        ]);

        const results = await collectResults(searchByFilename('zzzznonexistent'));
        expect(results).toHaveLength(0);
    });

    // Raw wasm-bindgen throws ("attempted to take ownership of Rust value while it was borrowed"
    // when a read is issued during a live write session, "null pointer passed to rust" from a
    // double free) used to escape execute() unclassified, land in classifyError's transient-unknown
    // bucket, and get the node quarantined into the repair table and replayed forever.
    describe('engine failures surface as permanent search library errors', () => {
        const expectPermanentEngineError = async (stream: AsyncGenerator<unknown>) => {
            const error = await collectResults(stream).catch((e: unknown) => e);

            expect(error).toBeInstanceOf(SearchLibraryError);
            expect(classifyError(error)).toEqual({ kind: 'permanent', reason: 'search_library_error' });
            expect(isRepairableError(error)).toBe(false);
        };

        it('when building the query throws', async () => {
            await expectPermanentEngineError(
                reader.execute(() => {
                    throw new Error('attempted to take ownership of Rust value while it was borrowed');
                })
            );
        });

        it('when advancing the search throws mid-iteration', async () => {
            await indexDocuments(writer, [
                makeTestIndexEntry('doc-1', { filename: { kind: 'text', value: 'quarterly report' } }),
            ]);
            jest.spyOn(engine, 'query').mockImplementation(() => {
                throw new Error('null pointer passed to rust');
            });

            await expectPermanentEngineError(searchByFilename('report'));
        });

        it('lets an abort through untouched so a stopping queue is not mistaken for a broken engine', async () => {
            const abort = new DOMException('aborted', 'AbortError');
            jest.spyOn(engine, 'query').mockImplementation(() => {
                throw abort;
            });

            const error = await collectResults(searchByFilename('report')).catch((e: unknown) => e);
            expect(error).toBe(abort);
        });
    });
});
