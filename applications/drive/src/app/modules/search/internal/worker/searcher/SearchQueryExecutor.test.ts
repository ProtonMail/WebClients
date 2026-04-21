import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { generateAndImportKey } from '@proton/crypto/lib/subtle/aesGcm';

import { SearchDB } from '../../shared/SearchDB';
import { collectResults, indexDocuments, makeTestIndexEntry } from '../../testing/indexHelpers';
import { setupRealSearchLibraryWasm } from '../../testing/setupRealSearchLibraryWasm';
import { IndexKind, IndexRegistry } from '../index/IndexRegistry';
import { normalizedFilenameForTag } from '../indexer/indexEntry';
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
        const cryptoKey = await generateAndImportKey();
        registry = new IndexRegistry(cryptoKey);
        executor = new SearchQueryExecutor(registry, db);
    });

    const indexDocs = async (...entries: ReturnType<typeof makeTestIndexEntry>[]) => {
        const instance = await registry.get(IndexKind.MAIN, db);
        await indexDocuments(instance.indexWriter, entries);
    };

    it('aggregates results across multiple engines', async () => {
        const PHOTOS = 'photos' as IndexKind;
        setActiveEnginesForTests([IndexKind.MAIN, PHOTOS]);

        const main = await registry.get(IndexKind.MAIN, db);
        await indexDocuments(main.indexWriter, [
            makeTestIndexEntry('file-1', {
                filename: { kind: 'tag', value: normalizedFilenameForTag('file_1.txt') },
                filenameText: { kind: 'text', value: normalizedFilenameForTag('file_1.txt') },
            }),
            makeTestIndexEntry('file-2', {
                filename: { kind: 'tag', value: normalizedFilenameForTag('file_2.jpeg') },
                filenameText: { kind: 'text', value: normalizedFilenameForTag('file_2.jpeg') },
            }),
            makeTestIndexEntry('folder-1', {
                filename: { kind: 'tag', value: normalizedFilenameForTag('folder_1') },
                filenameText: { kind: 'text', value: normalizedFilenameForTag('folder_1') },
            }),
        ]);

        const photos = await registry.get(PHOTOS, db);
        await indexDocuments(photos.indexWriter, [
            makeTestIndexEntry('file-3', {
                filename: { kind: 'tag', value: normalizedFilenameForTag('file_3.mpeg') },
                filenameText: { kind: 'text', value: normalizedFilenameForTag('file_3.mpeg') },
            }),
            makeTestIndexEntry('file-2', {
                filename: { kind: 'tag', value: normalizedFilenameForTag('file_2.jpeg') },
                filenameText: { kind: 'text', value: normalizedFilenameForTag('file_2.jpeg') },
            }),
        ]);

        const results = await collectResults(executor.performSearch({ filename: 'file' }));
        const sorted = results.sort(
            (a, b) => a.nodeUid.localeCompare(b.nodeUid) || a.indexKind.localeCompare(b.indexKind)
        );

        expect(sorted).toEqual([
            { nodeUid: 'file-1', score: expect.any(Number), indexKind: IndexKind.MAIN },
            { nodeUid: 'file-2', score: expect.any(Number), indexKind: IndexKind.MAIN },
            { nodeUid: 'file-2', score: expect.any(Number), indexKind: PHOTOS },
            { nodeUid: 'file-3', score: expect.any(Number), indexKind: PHOTOS },
        ]);

        expect(sorted.find((r) => r.nodeUid === 'folder-1')).toBeUndefined();
    });

    describe('filename matching', () => {
        const indexFileEntry = (id: string, name: string) =>
            makeTestIndexEntry(id, {
                filename: { kind: 'tag', value: normalizedFilenameForTag(name) },
                filenameText: { kind: 'text', value: normalizedFilenameForTag(name) },
            });

        it('returns empty when index is empty', async () => {
            await registry.get(IndexKind.MAIN, db);
            const results = await collectResults(executor.performSearch({ filename: 'file_1' }));
            expect(results).toHaveLength(0);
        });

        it('result has nodeUid, score, and indexKind', async () => {
            await indexDocs(indexFileEntry('file-1', 'file_1.txt'));

            const results = await collectResults(executor.performSearch({ filename: 'file_1' }));
            expect(results).toHaveLength(1);
            expect(results[0].nodeUid).toBe('file-1');
            expect(typeof results[0].score).toBe('number');
            expect(results[0].indexKind).toBe(IndexKind.MAIN);
        });

        it('returns no results for non-matching query', async () => {
            await indexDocs(indexFileEntry('file-1', 'file_1.txt'));

            const results = await collectResults(executor.performSearch({ filename: 'zzzznonexistent' }));
            expect(results).toHaveLength(0);
        });

        it('finds documents by text wildcard', async () => {
            await indexDocs(
                indexFileEntry('file-1', 'file_1_report.txt'),
                indexFileEntry('file-2', 'file_2_notes.txt'),
                indexFileEntry('folder-1', 'folder_1_report')
            );

            const results = await collectResults(executor.performSearch({ filename: 'report' }));
            const ids = results.map((r) => r.nodeUid);
            expect(ids).toContain('file-1');
            expect(ids).toContain('folder-1');
            expect(ids).not.toContain('file-2');
        });

        it('finds file by substring via tag match', async () => {
            await indexDocs(
                indexFileEntry('file-1', 'file_1_draft'),
                indexFileEntry('file-2', 'file_2.txt'),
                indexFileEntry('folder-1', 'folder_1_draft')
            );

            const results = await collectResults(executor.performSearch({ filename: 'draft' }));
            const ids = results.map((r) => r.nodeUid);
            expect(ids).toContain('file-1');
            expect(ids).toContain('folder-1');
            expect(ids).not.toContain('file-2');
        });

        it('finds file by short query (<3 chars) via tag match', async () => {
            await indexDocs(indexFileEntry('file-1', 'ab_file_1'), indexFileEntry('file-2', 'file_2.txt'));

            const results = await collectResults(executor.performSearch({ filename: 'ab' }));
            const ids = results.map((r) => r.nodeUid);
            expect(ids).toContain('file-1');
            // 'file_2.txt' normalizes to 'file2txt' which does not contain 'ab'
            expect(ids).not.toContain('file-2');
        });

        it('finds fuzzy text match (e.g. "file1" matches "file1" and "file2" but not "report")', async () => {
            await indexDocs(
                indexFileEntry('file-1', 'file1.txt'),
                indexFileEntry('file-2', 'file2.txt'),
                indexFileEntry('file-3', 'report.txt')
            );

            const results = await collectResults(executor.performSearch({ filename: 'file' }));
            const ids = results.map((r) => r.nodeUid);
            expect(ids).toContain('file-1');
            expect(ids).toContain('file-2');
            expect(ids).not.toContain('file-3');
        });

        it('finds file with special characters in name', async () => {
            await indexDocs(indexFileEntry('file-1', 'file_1-v2.0.txt'), indexFileEntry('folder-1', 'folder_1.doc'));

            const results = await collectResults(executor.performSearch({ filename: 'file' }));
            const ids = results.map((r) => r.nodeUid);
            expect(ids).toContain('file-1');
        });

        it('matches case-insensitively', async () => {
            await indexDocs(indexFileEntry('file-1', 'Report.pdf'), indexFileEntry('file-2', 'notes.txt'));

            for (const query of ['Report', 'report', 'REPORT']) {
                const results = await collectResults(executor.performSearch({ filename: query }));
                const ids = results.map((r) => r.nodeUid);
                expect(ids).toContain('file-1');
                expect(ids).not.toContain('file-2');
            }
        });

        it('matches query with spaces across word boundaries', async () => {
            await indexDocs(indexFileEntry('file-1', 'My file_name #1.png'), indexFileEntry('file-2', 'other.txt'));

            const results = await collectResults(executor.performSearch({ filename: 'My file' }));
            const ids = results.map((r) => r.nodeUid);
            expect(ids).toContain('file-1');
            expect(ids).not.toContain('file-2');
        });

        it('matches query with special characters like #', async () => {
            await indexDocs(indexFileEntry('file-1', 'My file_name #1.png'), indexFileEntry('file-2', 'other.txt'));

            const results = await collectResults(executor.performSearch({ filename: '#1' }));
            const ids = results.map((r) => r.nodeUid);
            expect(ids).toContain('file-1');
            expect(ids).not.toContain('file-2');
        });

        it('returns nothing for pure-special-char query', async () => {
            await indexDocs(indexFileEntry('file-1', 'My file_name #1.png'));

            const results = await collectResults(executor.performSearch({ filename: '#' }));
            expect(results).toHaveLength(0);
        });

        it('matches full filename with mixed special chars and spaces', async () => {
            await indexDocs(indexFileEntry('file-1', 'My file_name #1.png'), indexFileEntry('file-2', 'other.txt'));

            const results = await collectResults(executor.performSearch({ filename: 'My file_name #1.png' }));
            const ids = results.map((r) => r.nodeUid);
            expect(ids).toContain('file-1');
            expect(ids).not.toContain('file-2');
        });

        it('can fuzzy search', async () => {
            await indexDocs(indexFileEntry('file-1', 'My file_name #1.png'), indexFileEntry('file-2', 'other.txt'));

            const results = await collectResults(executor.performSearch({ filename: 'My file_name #2.png' }));
            const ids = results.map((r) => r.nodeUid);
            expect(ids).toContain('file-1');
            expect(ids).not.toContain('file-2');
        });
    });
});
