import { generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { SearchDB } from '../../shared/SearchDB';
import { collectResults, indexDocuments, makeTestIndexEntry } from '../../testing/indexHelpers';
import { setupRealSearchLibraryWasm } from '../../testing/setupRealSearchLibraryWasm';
import { IndexKind, IndexRegistry } from '../index/IndexRegistry';
import { normalizedFilenameForTag, normalizedFilenameForText } from '../indexer/indexEntry';
import { SearchQueryExecutor, setActiveEnginesForTests, singleWordTypoVariants } from './SearchQueryExecutor';

setupRealSearchLibraryWasm();

const MIXED_LIBRARY = {
    report: 'Quarterly report.pdf',
    finalReport: 'final_report_v2.docx',
    myFile: 'my_file_name_final.pdf',
    cafe: 'Café menu.txt',
    transfer: 'Überweisung März.pdf',
    tokyo: '東京の写真.jpg',
    longName: 'Projektdokumentation_Wanderung_Ibergflueh.pdf',
    emoji: '🎉 party.png',
    tarball: 'archive.tar.gz',
    invoice: 'Invoice (1).pdf',
    numbers: '12345.txt',
    doubleSpace: 'my  double space.txt',
};
type MixedId = keyof typeof MIXED_LIBRARY;

const PHOTO_LIBRARY = {
    target: 'photo_example_1_downloaded.jpg',
    sibling: 'photo_example_2_downloaded.jpg',
    shortName: 'photo_example.jpg',
    otherPhoto: 'photo_2020.jpg',
    archive: 'downloaded_stuff.zip',
    text: 'example.txt',
    camera: 'IMG_1234.jpg',
    folder200905: '2009-05',
    folder200907: '2009-07',
    folder2020: '2020',
    shot: '20260908_1515 02.jpg',
    nextShot: '20260908_1515 03.jpg',
    cameraShot: '20260908_151502.jpg',
};
type PhotoId = keyof typeof PHOTO_LIBRARY;
const PHOTO_NOISE: PhotoId[] = [
    'otherPhoto',
    'archive',
    'text',
    'camera',
    'folder200905',
    'folder200907',
    'folder2020',
];

const SINGLE_PHOTO_LIBRARY = {
    document: 'photo_example_1_downloaded.jpg',
    otherPhoto: 'photo_20200101.jpg',
    camera: 'IMG_1234.jpg',
};

const DATABASE_LIBRARY = {
    'file-1': 'Database Design',
    'file-2': 'other.txt',
};

const indexFileEntry = (id: string, name: string, trash: { trashTime?: bigint } = {}) =>
    makeTestIndexEntry(id, {
        filenameTag: { kind: 'tag', value: normalizedFilenameForTag(name) },
        filenameText: { kind: 'text', value: normalizedFilenameForText(name) },
        ...(trash.trashTime !== undefined ? { trashTime: { kind: 'integer' as const, value: trash.trashTime } } : {}),
    });

describe('filename querying', () => {
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

    const search = async (filename: string) =>
        (await collectResults(executor.performSearch({ filename }))).map((r) => r.nodeUid);

    /** Index every `id: name` entry of the library, then return the sorted ids matching the query. */
    const searchIn = async (library: Record<string, string>, filename: string) => {
        await indexDocs(...Object.entries(library).map(([id, name]) => indexFileEntry(id, name)));
        return (await search(filename)).sort();
    };

    describe('Filename querying suite: basics', () => {
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

            expect(await search('zzzznonexistent')).toHaveLength(0);
        });

        it('returns nothing for empty or whitespace-only query', async () => {
            await indexDocs(indexFileEntry('file-1', 'My file_name #1.png'));

            expect(await search('')).toHaveLength(0);
            expect(await search('   ')).toHaveLength(0);
        });

        it('aggregates results across multiple engines', async () => {
            const PHOTOS = 'photos' as IndexKind;
            setActiveEnginesForTests([IndexKind.MAIN, PHOTOS]);

            const main = await registry.get(IndexKind.MAIN, db);
            await indexDocuments(main.indexWriter, [
                indexFileEntry('file-1', 'file_1.txt'),
                indexFileEntry('file-2', 'file_2.jpeg'),
                indexFileEntry('folder-1', 'folder_1'),
            ]);

            const photos = await registry.get(PHOTOS, db);
            await indexDocuments(photos.indexWriter, [
                indexFileEntry('file-3', 'file_3.mpeg'),
                indexFileEntry('file-2', 'file_2.jpeg'),
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
    });

    // The query must appear in the lowercased name, with special characters taken literally.
    describe('Filename querying suite: literal substring match', () => {
        it('finds documents by text wildcard', async () => {
            await indexDocs(
                indexFileEntry('file-1', 'file_1_report.txt'),
                indexFileEntry('file-2', 'file_2_notes.txt'),
                indexFileEntry('folder-1', 'folder_1_report')
            );

            const ids = await search('report');
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

            const ids = await search('draft');
            expect(ids).toContain('file-1');
            expect(ids).toContain('folder-1');
            expect(ids).not.toContain('file-2');
        });

        it('finds file by short query (<3 chars) via tag match', async () => {
            await indexDocs(indexFileEntry('file-1', 'ab_file_1'), indexFileEntry('file-2', 'file_2.txt'));

            const ids = await search('ab');
            expect(ids).toContain('file-1');
            // 'file_2.txt' normalizes to 'file2txt' which does not contain 'ab'
            expect(ids).not.toContain('file-2');
        });

        it('finds a shared prefix (e.g. "file" matches "file1" and "file2" but not "report")', async () => {
            await indexDocs(
                indexFileEntry('file-1', 'file1.txt'),
                indexFileEntry('file-2', 'file2.txt'),
                indexFileEntry('file-3', 'report.txt')
            );

            const ids = await search('file');
            expect(ids).toContain('file-1');
            expect(ids).toContain('file-2');
            expect(ids).not.toContain('file-3');
        });

        it('finds file with special characters in name', async () => {
            await indexDocs(indexFileEntry('file-1', 'file_1-v2.0.txt'), indexFileEntry('folder-1', 'folder_1.doc'));

            expect(await search('file')).toContain('file-1');
        });

        it('matches case-insensitively', async () => {
            await indexDocs(indexFileEntry('file-1', 'Report.pdf'), indexFileEntry('file-2', 'notes.txt'));

            for (const query of ['Report', 'report', 'REPORT']) {
                const ids = await search(query);
                expect(ids).toContain('file-1');
                expect(ids).not.toContain('file-2');
            }
        });

        it('matches query with special characters like # literally', async () => {
            // Negative control: 'file-2' shares the stripped residue ("...1.png") but not the
            // literal "#1", so only 'file-1' must match - proving the '#' is matched literally.
            await indexDocs(
                indexFileEntry('file-1', 'My file_name #1.png'),
                indexFileEntry('file-2', 'My file_name 1.png'),
                indexFileEntry('file-3', 'other.txt')
            );

            const ids = await search('#1');
            expect(ids).toContain('file-1');
            expect(ids).not.toContain('file-2');
            expect(ids).not.toContain('file-3');
        });

        it('matches a lone special-character query', async () => {
            // With special chars preserved, "#" is a real substring search: it matches names
            // containing "#" and nothing else.
            await indexDocs(indexFileEntry('file-1', 'My file_name #1.png'), indexFileEntry('file-2', 'other.txt'));

            const ids = await search('#');
            expect(ids).toContain('file-1');
            expect(ids).not.toContain('file-2');
        });

        it('treats a literal * in the query as a literal character', async () => {
            await indexDocs(indexFileEntry('file-1', 'a*b.txt'), indexFileEntry('file-2', 'axb.txt'));

            // Func.Equals matches the `.then()` part verbatim, so the '*' is literal, not a
            // wildcard: only the file that actually contains '*' matches. (The stripped text
            // residue 'ab' is < 3 chars, so the fuzzy path contributes nothing here.)
            const ids = await search('a*b');
            expect(ids).toContain('file-1');
            expect(ids).not.toContain('file-2');
        });

        it('matches full filename with mixed special chars and spaces', async () => {
            await indexDocs(indexFileEntry('file-1', 'My file_name #1.png'), indexFileEntry('file-2', 'other.txt'));

            const ids = await search('My file_name #1.png');
            expect(ids).toContain('file-1');
            expect(ids).not.toContain('file-2');
        });

        it.each<[string, MixedId[]]>([
            ['report', ['report', 'finalReport']],
            [' report ', ['report', 'finalReport']],
            ['quarterly report', ['report']],
            ['report.pdf', ['report']],
            ['pdf', ['report', 'myFile', 'transfer', 'longName', 'invoice']],
            ['.pdf', ['report', 'myFile', 'transfer', 'longName', 'invoice']],
            ['123', ['numbers']],
            ['2345', ['numbers']],
        ])('substring %j matches %j', async (query, expected) => {
            expect(await searchIn(MIXED_LIBRARY, query)).toEqual([...expected].sort());
        });

        it.each<[string, MixedId[]]>([
            ['.tar.gz', ['tarball']],
            ['(1)', ['invoice']],
            ['my  double', ['doubleSpace']],
            ['🎉', ['emoji']],
            ['party', ['emoji']],
        ])('special characters and whitespace in %j match literally: %j', async (query, expected) => {
            expect(await searchIn(MIXED_LIBRARY, query)).toEqual([...expected].sort());
        });

        it.each<[string, MixedId[]]>([
            ['café', ['cafe']],
            ['CAFÉ', ['cafe']],
            ['überweisung', ['transfer']],
            ['ÜBERWEISUNG', ['transfer']],
            ['märz', ['transfer']],
            ['東京', ['tokyo']],
            ['写真', ['tokyo']],
        ])('non-ASCII %j matches case-insensitively: %j', async (query, expected) => {
            expect(await searchIn(MIXED_LIBRARY, query)).toEqual([...expected].sort());
        });

        it.each<[string, MixedId[]]>([
            ['Projektdokumentation', ['longName']],
            ['Wanderung', ['longName']],
            ['Ibergflueh', ['longName']],
        ])('long names match by substring %j', async (query, expected) => {
            expect(await searchIn(MIXED_LIBRARY, query)).toEqual([...expected].sort());
        });

        it.each([['final-report'], ['my-file']])(
            '%j does not match (dash vs underscore: only spaces act as wildcards)',
            async (query) => {
                expect(await searchIn(MIXED_LIBRARY, query)).toEqual([]);
            }
        );
    });

    // Each run of whitespace in the query becomes a wildcard: words must appear in order, but any
    // separator may sit between them.
    describe('Filename querying suite: spaces between words', () => {
        it('matches query with spaces across word boundaries', async () => {
            await indexDocs(indexFileEntry('file-1', 'My file_name #1.png'), indexFileEntry('file-2', 'other.txt'));

            const ids = await search('My file');
            expect(ids).toContain('file-1');
            expect(ids).not.toContain('file-2');
        });

        it.each<[string, MixedId[]]>([
            ['final report', ['finalReport']],
            ['my file name', ['myFile']],
            ['tar gz', ['tarball']],
            ['invoice 1', ['invoice']],
            ['my double', ['doubleSpace']],
        ])('spaces in %j match any separator between words: %j', async (query, expected) => {
            expect(await searchIn(MIXED_LIBRARY, query)).toEqual([...expected].sort());
        });

        it('"report quarterly" does not match (word order)', async () => {
            expect(await searchIn(MIXED_LIBRARY, 'report quarterly')).toEqual([]);
        });
    });

    // Trigram similarity against the whole name with special characters stripped: tolerates
    // typos, missing accents and changed digits only when the query is close to the full name.
    describe('Filename querying suite: fuzzy match on the whole name', () => {
        it('can fuzzy search', async () => {
            await indexDocs(indexFileEntry('file-1', 'My file_name #1.png'), indexFileEntry('file-2', 'other.txt'));

            const ids = await search('My file_name #2.png');
            expect(ids).toContain('file-1');
            expect(ids).not.toContain('file-2');
        });

        it('name with a typo still finds the file, without noise', async () => {
            const ids = await searchIn(PHOTO_LIBRARY, 'photo_examlpe_1_downloaded.jpg');
            expect(ids).toContain('target');
            expect(ids).toEqual(expect.not.arrayContaining(PHOTO_NOISE));
        });

        it.each<[string, MixedId[]]>([
            ['Uberweisung Marz.pdf', ['transfer']],
            ['Cafe menu.txt', ['cafe']],
        ])('near-complete name %j matches despite missing accents: %j', async (query, expected) => {
            expect(await searchIn(MIXED_LIBRARY, query)).toEqual([...expected].sort());
        });

        it('finds the only matching document when a digit differs', async () => {
            expect(await searchIn(SINGLE_PHOTO_LIBRARY, 'photo_example_2_downloaded.jpg')).toEqual(['document']);
        });

        // Known gap: fuzzy matching is case-sensitive (the text attribute keeps the original case
        // and the engine runs with case-insensitivity off), so capitals plus the digit change
        // drop below the similarity cutoff.
        it.failing('finds the only matching document when a digit differs and the query is capitalized', async () => {
            expect(await searchIn(SINGLE_PHOTO_LIBRARY, 'Photo_Example_2_Downloaded.jpg')).toEqual(['document']);
        });
    });

    // Whole-name fuzzy matching can't catch a typo in one word of a longer name, so a single
    // letters-only word of 5+ characters is expanded into one-typo substring variants.
    describe('Filename querying suite: typo variants for a single word', () => {
        it.each(['database', 'design', 'datbase', 'desing', 'databsae', 'dattabase', 'databese'])(
            'finds "Database Design" by the word %j',
            async (query) => {
                expect(await searchIn(DATABASE_LIBRARY, query)).toEqual(['file-1']);
            }
        );

        it.each<[string, MixedId[]]>([
            ['reprot', ['report', 'finalReport']],
            ['Quartely', ['report']],
            ['Wandrung', ['longName']],
            ['finalreport', ['finalReport']],
            ['uberweisung', ['transfer']],
        ])('single word %j with one typo matches: %j', async (query, expected) => {
            expect(await searchIn(MIXED_LIBRARY, query)).toEqual([...expected].sort());
        });

        it.each([
            ['cafe', 'missing accent, word too short for typo variants'],
            ['reprto quarterly', 'typo in a multi-word query'],
        ])('%j does not match (%s)', async (query) => {
            expect(await searchIn(MIXED_LIBRARY, query)).toEqual([]);
        });

        it('accepts loose matches from typo gap variants', async () => {
            // Known tradeoff: "datbase" yields the gap variant *dat*ase*, which also matches
            // unrelated names that contain "dat" followed later by "ase".
            await indexDocs(indexFileEntry('file-1', 'Data release.csv'), indexFileEntry('file-2', 'other.txt'));
            expect(await search('datbase')).toEqual(['file-1']);
        });

        describe('singleWordTypoVariants', () => {
            it('covers swapped, extra, missing and wrong letters', () => {
                const variants = singleWordTypoVariants('design').map((segments) => segments.join('*'));
                expect(variants).toEqual(
                    expect.arrayContaining([
                        'edsign', // swapped
                        'esign', // extra letter removed
                        'de*sign', // missing letter
                        'de*ign', // wrong letter
                    ])
                );
                expect(variants).not.toContain('design');
            });

            it.each(['desi', '20260908', 'photo1', 'final report', 'my-file'])('returns no variants for %j', (word) => {
                expect(singleWordTypoVariants(word)).toEqual([]);
            });
        });
    });

    describe('Filename querying suite: precision', () => {
        it('exact name returns only that file and near-identical names', async () => {
            expect(await searchIn(PHOTO_LIBRARY, 'photo_example_1_downloaded.jpg')).toEqual(
                ['sibling', 'target'].sort()
            );
        });

        it('date-named photo with a space does not match unrelated date folders', async () => {
            // Regression: a wildcard on the fuzzy term skipped the similarity cutoff, so any
            // name sharing a single trigram (e.g. "2009-05") matched.
            expect(await searchIn(PHOTO_LIBRARY, '20260908_1515 02.jpg')).toEqual(
                ['cameraShot', 'nextShot', 'shot'].sort()
            );
        });
    });

    describe('Filename querying suite: filters', () => {
        it('excludes self-trashed entries (trashTime > 0)', async () => {
            await indexDocs(
                indexFileEntry('file-1', 'report.pdf'),
                indexFileEntry('file-2', 'report_trashed.pdf', { trashTime: 123n })
            );

            const ids = await search('report');
            expect(ids).toContain('file-1');
            expect(ids).not.toContain('file-2');
        });
    });
});
