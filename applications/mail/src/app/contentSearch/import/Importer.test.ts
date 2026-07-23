// Integration test for the full import path: seed a real (encrypted) legacy encrypted-search
// index in fake-indexeddb, run the Importer, then read the resulting content-search-v2 index back
// with IndexReader to confirm the documents made it across.
import type { PrivateKeyReference } from '@protontech/crypto';
import 'fake-indexeddb/auto';

import { initializeEncryptedSearch, serializeAndEncryptItem } from '@proton/encrypted-search/esHelpers';
import { openESDB } from '@proton/encrypted-search/esIDB';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import type { ESBaseMessage, ESMessageContent } from 'proton-mail/models/encryptedSearch.ts';

import {
    generateKeys,
    getStoredUserKey,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../helpers/test/crypto';
import { IndexReader } from '../search/IndexReader';
import { initFoundationWasm } from '../testing/initFoundationWasm';
import { ImportIssueSeverity, Importer } from './Importer';

/** start() is fire-and-forget; it emits progress 1 once finished (on success or failure). */
const completionToPromise = (importer: Importer) =>
    new Promise<void>((resolve) => {
        const unsubscribe = importer.onProgress.subscribe((progress) => {
            if (progress === 1) {
                unsubscribe();
                resolve();
            }
        });
    });

type Doc = { metadata: ESBaseMessage; body: string };

const makeDoc = (
    id: string,
    subject: string,
    body: string,
    {
        time = 1_700_000_000,
        sender = 'sender@proton.me',
        to = 'to@proton.me',
        labelIDs = ['0'],
        numAttachments = 0,
    } = {}
): Doc => ({
    metadata: {
        ID: id,
        Subject: subject,
        Time: time,
        NumAttachments: numAttachments,
        Sender: { Address: sender, Name: 'Sender' },
        ToList: [{ Address: to, Name: 'To' }],
        CCList: [],
        LabelIDs: labelIDs,
        AddressID: 'address-1',
    } as any as ESBaseMessage,
    body,
});

/** Seed a legacy encrypted-search index with the given documents, encrypted the way production does. */
const seedOldIndex = async (userId: string, userKeys: DecryptedKey<PrivateKeyReference>[], docs: Doc[]) => {
    const { indexKey } = await initializeEncryptedSearch({
        userID: userId,
        getUserKeys: async () => userKeys,
        previousEventIDs: {},
        isRefreshed: false,
        totalItems: docs.length,
    });
    if (!indexKey) {
        throw new Error('failed to set up legacy index key');
    }
    const esDB = await openESDB(userId);
    if (!esDB) {
        throw new Error('failed to open legacy index db');
    }
    // the legacy `temporal` index on timepoint is unique, so each item needs a distinct timepoint.
    for (const [order, { metadata, body }] of docs.entries()) {
        const encryptedMetadata = await serializeAndEncryptItem(indexKey, metadata, 1);
        const encryptedContent = await serializeAndEncryptItem(
            indexKey,
            { decryptedBody: body } as ESMessageContent,
            1
        );
        await esDB.put(
            'metadata',
            { timepoint: [metadata.Time, order], aesGcmCiphertext: encryptedMetadata },
            metadata.ID
        );
        await esDB.put('content', encryptedContent, metadata.ID);
    }
    esDB.close();
};

describe('Importer', () => {
    let userKeys: DecryptedKey<PrivateKeyReference>[];

    beforeAll(async () => {
        await setupCryptoProxyForTesting();
        await initFoundationWasm();
        const generated = await generateKeys('Tester', 'tester@proton.me');
        userKeys = getStoredUserKey(generated) as unknown as DecryptedKey<PrivateKeyReference>[];
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    it('imports documents from the legacy index into the new content-search index', async () => {
        const userId = 'importer-user-1';
        await seedOldIndex(userId, userKeys, [
            makeDoc('m1', 'Invoice March', 'here is your invoice for march'),
            makeDoc('m2', 'Vacation photos', 'sunny beach and palm trees'),
        ]);

        const importer = new Importer(userId, async () => userKeys);
        const completion = completionToPromise(importer);
        // start() takes a batch size for tests; 1 exercises the multi-batch loop and the per-batch
        // cleanup between writes.
        importer.start(1);
        await completion;
        // the importer swallows failures into issues rather than throwing, so assert it ran clean.
        expect(importer.issues.filter((issue) => issue.severity === ImportIssueSeverity.Fatal)).toEqual([]);
        expect(importer.progress).toBe(1);

        const reader = await IndexReader.open(userId, userKeys);
        expect(await reader.count()).toBe(2);

        // the exported document carries the staged metadata attributes verbatim...
        const doc: any = await reader.getDocumentById('m1');
        expect(doc.identifier).toBe('m1');
        expect(doc.attributes).toMatchObject({
            addressId: ['address-1'],
            sender: ['sender@proton.me'],
            recipient: ['to@proton.me'],
            labelId: ['0'],
            hasAttachments: [false],
            time: [1_700_000_000],
        });
        // ...and the subject/body are tokenised into [position, token] pairs.
        const tokens = (attribute: [number, string][][]) => attribute[0].map(([, token]) => token);
        expect(tokens(doc.attributes.subject)).toEqual(['invoice', 'march']);
        expect(tokens(doc.attributes.body)).toEqual(['here', 'your', 'invoice', 'for', 'march']);

        // a document that was never indexed is not found.
        expect(await reader.getDocumentById('does-not-exist')).toBeUndefined();
    }, 30_000);
});
