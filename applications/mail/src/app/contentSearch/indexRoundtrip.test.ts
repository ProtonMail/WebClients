// End-to-end test across the content-search subsystem: write documents with IndexWriter, then
// find them with IndexReader. Exercises the real wasm engine, blob encryption and IndexedDB,
// wired together the way production does (a shared DB + index key).
import { generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import 'fake-indexeddb/auto';
import type { IDBPDatabase } from 'idb';

import type { NormalizedSearchParams } from '@proton/encrypted-search/models';

import type { ESBaseMessage } from 'proton-mail/models/encryptedSearch.ts';

import { openContentSearchDB } from './db/open';
import type { Database } from './db/schema';
import { IndexWriter } from './indexation/IndexWriter';
import { IndexReader } from './search/IndexReader';
import { buildQuery } from './search/query';
import { initFoundationWasm } from './testing/initFoundationWasm';

const makeMessage = (
    id: string,
    subject: string,
    body: string,
    time = 1_700_000_000
): { metadata: ESBaseMessage; body: string } => ({
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
    } as any as ESBaseMessage,
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

describe('IndexWriter + IndexReader roundtrip', () => {
    let db: IDBPDatabase<Database>;
    let key: CryptoKey;
    let dbCounter = 0;

    beforeAll(async () => {
        await initFoundationWasm();
    });

    beforeEach(async () => {
        db = await openContentSearchDB(`roundtrip-user-${dbCounter++}`);
        key = await generateAndImportKey();
    });

    it('writes two documents and returns only the one matching the query', async () => {
        const writer = new IndexWriter(db, key);
        await writer.writeBatch([
            makeMessage('msg-apple', 'Fruit basket', 'hello world apple pie'),
            makeMessage('msg-banana', 'Grocery list', 'goodbye cruel banana bread'),
        ]);

        const reader = new IndexReader(db, key);
        const search = (keyword: string) => reader.search(buildQuery(query({ keyword })), new AbortController().signal);

        // each keyword matches exactly one of the two documents...
        expect(await search('apple')).toEqual(['msg-apple']);
        expect(await search('banana')).toEqual(['msg-banana']);
        // ...and a term present in neither matches nothing.
        expect(await search('elephant')).toEqual([]);
    });

    it('filters by time range, returning only documents inside the bounds', async () => {
        const writer = new IndexWriter(db, key);
        await writer.writeBatch([
            makeMessage('msg-old', 'Report', 'quarterly shared summary', 1_000),
            makeMessage('msg-new', 'Report', 'quarterly shared summary', 2_000),
        ]);

        const reader = new IndexReader(db, key);
        const search = (search: NormalizedSearchParams['search']) =>
            reader.search(buildQuery(query(search)), new AbortController().signal);

        // both documents share the keyword; the time bounds select exactly one.
        expect(await search({ keyword: 'shared', begin: 1_500, end: 2_500 })).toEqual(['msg-new']);
        expect(await search({ keyword: 'shared', begin: 500, end: 1_500 })).toEqual(['msg-old']);
        // a window covering both returns both.
        expect((await search({ keyword: 'shared', begin: 0, end: 3_000 })).sort()).toEqual(['msg-new', 'msg-old']);
        // a window covering neither returns nothing.
        expect(await search({ keyword: 'shared', begin: 5_000, end: 6_000 })).toEqual([]);
    });
});
