// End-to-end test across the content-search subsystem: write documents with EngineWrapper, then
// find them with IndexReader. Exercises the real wasm engine, blob encryption and IndexedDB,
// wired together the way production does (a shared DB + index key).
import { generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import 'fake-indexeddb/auto';
import type { IDBPDatabase } from 'idb';

import type { NormalizedSearchParams } from '@proton/encrypted-search/models/mail';
import type { MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';

import { BlobCache } from './cache/BlobCache';
import { EncryptedBlobTransaction } from './crypto/EncryptedBlobTransaction';
import { openContentSearchDB } from './db/open';
import type { Database } from './db/schema';
import { createMailSearchEngine } from './engine/create';
import { MailDelegate } from './indexation/worker/MailDelegate';
import { EngineWrapper } from './indexation/worker/wrapper';
import { IndexReader } from './search/IndexReader';
import { SearchLoop } from './search/SearchLoop';
import { buildQuery } from './search/query';
import { initContentSearchWasm } from './testing/initContentSearchWasm';

const makeMessage = (
    id: string,
    subject: string,
    body: string,
    time = 1_700_000_000
): { metadata: MessageMetadata; body: string } => ({
    metadata: {
        ID: id,
        Subject: subject,
        Time: time,
        NumAttachments: 0,
        Sender: { Address: 'sender@proton.me', Name: 'Sender' },
        ToList: [{ Address: 'to@proton.me', Name: 'To' }],
        CCList: [],
        LabelIDs: ['0'],
        AddressID: 'address-1',
    } as any as MessageMetadata,
    body,
});

const query = (search: NormalizedSearchParams['search']): NormalizedSearchParams =>
    ({
        labelIDs: [],
        sort: { sort: 'Time', desc: true },
        filter: {},
        search,
        normalizedKeywords: undefined,
    }) as NormalizedSearchParams;

const search = async (reader: IndexReader, search: NormalizedSearchParams['search']) => {
    const ids: string[] = [];
    await reader.search(buildQuery(query(search)), (batch) => ids.push(...batch), new AbortController().signal);
    return ids;
};

describe('EngineWrapper + IndexReader roundtrip', () => {
    let db: IDBPDatabase<Database>;
    let key: CryptoKey;
    let blobCache: BlobCache;
    let engine: EngineWrapper;
    let dbCounter = 0;

    beforeAll(async () => {
        await initContentSearchWasm();
    });

    beforeEach(async () => {
        db = await openContentSearchDB(`roundtrip-user-${dbCounter++}`);
        key = await generateAndImportKey();
        blobCache = new BlobCache();
        engine = new EngineWrapper(createMailSearchEngine(), new MailDelegate());
    });

    afterEach(() => {
        engine.dispose();
        blobCache.free();
        db.close();
    });

    // a write doesn't commit on its own: it stages an EncryptedBlobTransaction that the caller
    // encrypts and writes as part of an idb transaction (mirrors how IndexWorker commits a batch).
    const writeMessages = async (messages: { metadata: MessageMetadata; body: string }[]) => {
        const blobTxn = await EncryptedBlobTransaction.start(blobCache, db, key);
        const write = engine.write();
        try {
            for (const { metadata, body } of messages) {
                write.insertMessage(metadata, body);
            }
            await write.execute(blobTxn);
        } finally {
            write.dispose();
        }
        const sealed = await blobTxn.encrypt();
        const txn = db.transaction(['config', 'index_blobs'], 'readwrite');
        await sealed.verifyAndWrite(txn);
        await txn.done;
    };

    it('writes two documents and returns only the one matching the query', async () => {
        await writeMessages([
            makeMessage('msg-apple', 'Fruit basket', 'hello world apple pie'),
            makeMessage('msg-banana', 'Grocery list', 'goodbye cruel banana bread'),
        ]);

        const reader = new IndexReader(db, key);

        // each keyword matches exactly one of the two documents...
        expect(await search(reader, { keyword: 'apple' })).toEqual(['msg-apple']);
        expect(await search(reader, { keyword: 'banana' })).toEqual(['msg-banana']);
        // ...and a term present in neither matches nothing.
        expect(await search(reader, { keyword: 'elephant' })).toEqual([]);
    });

    it('filters by time range, returning only documents inside the bounds', async () => {
        await writeMessages([
            makeMessage('msg-old', 'Report', 'quarterly shared summary', 1_000),
            makeMessage('msg-new', 'Report', 'quarterly shared summary', 2_000),
        ]);

        const reader = new IndexReader(db, key);

        // both documents share the keyword; the time bounds select exactly one.
        expect(await search(reader, { keyword: 'shared', begin: 1_500, end: 2_500 })).toEqual(['msg-new']);
        expect(await search(reader, { keyword: 'shared', begin: 500, end: 1_500 })).toEqual(['msg-old']);
        // a window covering both returns both.
        expect((await search(reader, { keyword: 'shared', begin: 0, end: 3_000 })).sort()).toEqual([
            'msg-new',
            'msg-old',
        ]);
        // a window covering neither returns nothing.
        expect(await search(reader, { keyword: 'shared', begin: 5_000, end: 6_000 })).toEqual([]);
    });

    describe('with more matches than the bucketing threshold', () => {
        const MATCH_COUNT = 90;
        const BUCKET_SIZE_SECONDS = 60 * 60 * 24 * 90;
        const BASE_TIME = 1_700_000_000;

        const writeMatchingMessages = async (timeForIndex: (index: number) => number) => {
            const messages = Array.from({ length: MATCH_COUNT }, (_, index) => {
                return makeMessage(`msg-${index}`, 'Bulk seed message', 'routing checks', timeForIndex(index));
            });
            await writeMessages(messages);
            return messages.map(({ metadata }) => {
                return metadata.ID;
            });
        };

        let bucketedSearchSpy: jest.SpyInstance;

        beforeEach(() => {
            bucketedSearchSpy = jest.spyOn(SearchLoop.prototype, 'runBucketedSearch');
        });

        afterEach(() => {
            bucketedSearchSpy.mockRestore();
        });

        it('returns every match when all messages share the same time', async () => {
            const ids = await writeMatchingMessages(() => {
                return BASE_TIME;
            });

            const results = await search(new IndexReader(db, key), { keyword: 'routing' });

            expect(bucketedSearchSpy).toHaveBeenCalledTimes(1);
            expect(results.sort()).toEqual(ids.sort());
        });

        it('returns every match when different times fall into a single bucket', async () => {
            const ids = await writeMatchingMessages((index) => {
                return BASE_TIME + index * 60;
            });

            const results = await search(new IndexReader(db, key), { keyword: 'routing' });

            expect(bucketedSearchSpy).toHaveBeenCalledTimes(1);
            expect(results.sort()).toEqual(ids.sort());
        });

        it('returns every match exactly once when times span several buckets', async () => {
            // a third of the messages sit exactly one bucket below the newest, on a bucket boundary
            const ids = await writeMatchingMessages((index) => {
                return BASE_TIME + (index % 3) * BUCKET_SIZE_SECONDS;
            });

            const results = await search(new IndexReader(db, key), { keyword: 'routing' });

            expect(bucketedSearchSpy.mock.calls.length).toBeGreaterThan(1);
            expect(results.length).toBe(MATCH_COUNT);
            expect(results.sort()).toEqual(ids.sort());
        });
    });
});
