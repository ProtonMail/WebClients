import { generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import type { IDBPDatabase } from 'idb';
import 'fake-indexeddb/auto';
// End-to-end test across the content-search subsystem: write documents with EngineWrapper, then
// find them with IndexReader. Exercises the real wasm engine, blob encryption and IndexedDB,
// wired together the way production does (a shared DB + index key).
import type { MockInstance } from 'vitest';

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
        BCCList: [],
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

        let bucketedSearchSpy: MockInstance;

        beforeEach(() => {
            bucketedSearchSpy = vi.spyOn(SearchLoop.prototype, 'runBucketedSearch');
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

    it('finds a message by the name of a listable attachment', async () => {
        const withAttachments = makeMessage('msg-invoice', 'Hello', 'see attached');
        withAttachments.metadata.AttachmentsMetadata = [
            { ID: 'a1', Name: 'Q3_invoice-final.pdf', MIMEType: 'application/pdf', Disposition: 'attachment', Size: 1 },
            { ID: 'a2', Name: 'publickey.asc', MIMEType: 'application/pgp-keys', Disposition: 'attachment', Size: 1 },
        ] as MessageMetadata['AttachmentsMetadata'];
        await writeMessages([withAttachments, makeMessage('msg-other', 'Hello', 'nothing here')]);

        const reader = new IndexReader(db, key);

        expect(await search(reader, { keyword: 'invoice' })).toEqual(['msg-invoice']);
        expect(await search(reader, { keyword: 'attachment~invoice' })).toEqual(['msg-invoice']);
        // non-listable attachments are not indexed
        expect(await search(reader, { keyword: 'publickey' })).toEqual([]);
    });

    describe('addresses', () => {
        const makeAddressedMessage = (
            id: string,
            addresses: Pick<MessageMetadata, 'Sender' | 'ToList' | 'CCList' | 'BCCList'>
        ) => {
            const message = makeMessage(id, 'Hello', 'nothing here');
            Object.assign(message.metadata, addresses);
            return message;
        };

        beforeEach(async () => {
            await writeMessages([
                makeAddressedMessage('msg-alice', {
                    Sender: { Address: ' Alice.Smith@Proton.me ', Name: ' Alice Smith ' },
                    ToList: [
                        { Address: 'bob@example.com', Name: '' },
                        { Address: ' ', Name: 'Mystery Guest' },
                        { Address: 'carol@example.com', Name: 'Carol Jones' },
                    ],
                    CCList: [{ Address: 'dave@example.com', Name: 'Dave' }],
                    BCCList: [{ Address: 'erin@example.com', Name: 'Erin' }],
                }),
                makeAddressedMessage('msg-other', {
                    Sender: { Address: 'frank@example.com', Name: 'Frank' },
                    ToList: [{ Address: 'grace@example.com', Name: 'Grace' }],
                    CCList: [],
                    BCCList: [],
                }),
            ]);
        });

        it('lays out each address as email tag, email text and display name, keeping empty names and emails', async () => {
            const doc: any = await new IndexReader(db, key).getDocumentById('msg-alice');
            const tokens = (value: [number, string][] | null) => (value ?? []).map(([, token]) => token);

            expect(doc.attributes.from[0]).toBe('alice.smith@proton.me');
            expect(tokens(doc.attributes.from[2])).toEqual(['alice', 'smith']);
            expect(doc.attributes.to[0]).toBe('bob@example.com');
            expect(tokens(doc.attributes.to[2])).toEqual([]);
            // the address without an email keeps its slots, with its name still indexed
            expect(doc.attributes.to[3] ?? null).toBeNull();
            expect(doc.attributes.to[4] ?? null).toBeNull();
            expect(tokens(doc.attributes.to[5])).toEqual(['mystery', 'guest']);
            expect(doc.attributes.to[6]).toBe('carol@example.com');
            expect(tokens(doc.attributes.to[8])).toEqual(['carol', 'jones']);
            expect(doc.attributes.to).not.toContain('');
        });

        it('finds the sender by full address regardless of case, by email token and by name', async () => {
            const reader = new IndexReader(db, key);

            expect(await search(reader, { from: 'ALICE.SMITH@proton.me' })).toEqual(['msg-alice']);
            expect(await search(reader, { from: 'alice' })).toEqual(['msg-alice']);
            expect(await search(reader, { from: 'smith' })).toEqual(['msg-alice']);
            expect(await search(reader, { from: 'bob@example.com' })).toEqual([]);
            expect(await search(reader, { from: 'alice smith' })).toEqual(['msg-alice']);
            // whole tokens in the order typed: the element list would drop such a hit but still count it (see `createAddressQuery`)
            expect(await search(reader, { from: 'smtih' })).toEqual([]);
            expect(await search(reader, { from: 'smith alice' })).toEqual([]);
        });

        it('matches a phrase across separators, which the element list still drops (see `createAddressQuery`)', async () => {
            await writeMessages([
                makeAddressedMessage('msg-john', {
                    Sender: { Address: 'john.doe@example.com', Name: 'JD' },
                    ToList: [],
                    CCList: [],
                    BCCList: [],
                }),
            ]);

            expect(await search(new IndexReader(db, key), { from: 'john doe' })).toEqual(['msg-john']);
        });

        it('finds recipients in to, cc and bcc', async () => {
            const reader = new IndexReader(db, key);

            expect(await search(reader, { to: 'bob@example.com' })).toEqual(['msg-alice']);
            expect(await search(reader, { to: 'jones' })).toEqual(['msg-alice']);
            expect(await search(reader, { to: 'mystery' })).toEqual(['msg-alice']);
            // a full address doesn't fuzzily match another one at the same domain (grace@example.com)
            expect(await search(reader, { to: 'dave@example.com' })).toEqual(['msg-alice']);
            expect(await search(reader, { to: 'erin' })).toEqual(['msg-alice']);
            expect(await search(reader, { to: 'grace' })).toEqual(['msg-other']);
            expect(await search(reader, { to: 'alice.smith@proton.me' })).toEqual([]);
        });
    });
});
