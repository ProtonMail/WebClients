import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { SearchDB } from '../../shared/SearchDB';
import { collectResults, indexDocuments, makeTestIndexEntry } from '../../testing/indexHelpers';
import { setupRealSearchLibraryWasm } from '../../testing/setupRealSearchLibraryWasm';
import { IndexKind, IndexRegistry } from '../index/IndexRegistry';
import { SearchQueryExecutor, setActiveEnginesForTests } from './SearchQueryExecutor';

setupRealSearchLibraryWasm();

describe('SearchQueryExecutor integration', () => {
    let db: SearchDB;
    let registry: IndexRegistry;
    let executor: SearchQueryExecutor;

    beforeAll(() => {
        setActiveEnginesForTests([IndexKind.MAIN]);
    });

    beforeEach(async () => {
        indexedDB = new IDBFactory();
        db = await SearchDB.open('test-user');
        registry = new IndexRegistry();
        executor = new SearchQueryExecutor(registry, db);
    });

    const indexDocs = async (...entries: ReturnType<typeof makeTestIndexEntry>[]) => {
        const instance = await registry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, entries);
    };

    it('returns empty when index is empty', async () => {
        // Force engine creation so search has something to query
        await registry.get(IndexKind.MAIN, db);
        const results = await collectResults(executor.performSearch({ filename: 'test' }));
        expect(results).toHaveLength(0);
    });

    it('finds documents by filename wildcard', async () => {
        await indexDocs(
            makeTestIndexEntry('doc-1', { filename: { kind: 'text', value: 'quarterly report' } }),
            makeTestIndexEntry('doc-2', { filename: { kind: 'text', value: 'meeting notes' } }),
            makeTestIndexEntry('doc-3', { filename: { kind: 'text', value: 'annual report 2024' } })
        );

        const results = await collectResults(executor.performSearch({ filename: 'report' }));
        const ids = results.map((r) => r.nodeUid);
        expect(ids).toContain('doc-1');
        expect(ids).toContain('doc-3');
    });

    it('result has nodeUid, score, and indexKind', async () => {
        await indexDocs(makeTestIndexEntry('doc-1', { filename: { kind: 'text', value: 'test file' } }));

        const results = await collectResults(executor.performSearch({ filename: 'test' }));
        expect(results).toHaveLength(1);
        expect(results[0].nodeUid).toBe('doc-1');
        expect(typeof results[0].score).toBe('number');
        expect(results[0].indexKind).toBe(IndexKind.MAIN);
    });

    it('aggregates results across multiple engines', async () => {
        const PHOTOS = 'photos' as IndexKind;
        setActiveEnginesForTests([IndexKind.MAIN, PHOTOS]);

        const main = await registry.get(IndexKind.MAIN, db);
        await indexDocuments(main.indexWriter, [
            makeTestIndexEntry('doc-uid', { filename: { kind: 'text', value: 'vacation_expenses.txt' } }),
            makeTestIndexEntry('another-doc-uid', { filename: { kind: 'text', value: 'vacation_file.jpeg' } }),
            makeTestIndexEntry('other-doc-uid', { filename: { kind: 'text', value: 'unrelated.doc' } }),
        ]);

        const photos = await registry.get(PHOTOS, db);
        await indexDocuments(photos.indexWriter, [
            makeTestIndexEntry('photos-doc-uid', { filename: { kind: 'text', value: 'vacation_video.mpeg' } }),
            makeTestIndexEntry('another-doc-uid', { filename: { kind: 'text', value: 'vacation_file.jpeg' } }),
        ]);

        const results = await collectResults(executor.performSearch({ filename: 'vacation' }));
        const sorted = results.sort(
            (a, b) => a.nodeUid.localeCompare(b.nodeUid) || a.indexKind.localeCompare(b.indexKind)
        );

        expect(sorted).toEqual([
            { nodeUid: 'another-doc-uid', score: expect.any(Number), indexKind: IndexKind.MAIN },
            { nodeUid: 'another-doc-uid', score: expect.any(Number), indexKind: PHOTOS },
            { nodeUid: 'doc-uid', score: expect.any(Number), indexKind: IndexKind.MAIN },
            { nodeUid: 'photos-doc-uid', score: expect.any(Number), indexKind: PHOTOS },
        ]);

        expect(sorted.find((r) => r.nodeUid === 'other-doc-uid')).toBeUndefined();
    });

    it('returns no results for non-matching query', async () => {
        await indexDocs(makeTestIndexEntry('doc-1', { filename: { kind: 'text', value: 'hello world' } }));

        const results = await collectResults(executor.performSearch({ filename: 'zzzznonexistent' }));
        expect(results).toHaveLength(0);
    });
});
