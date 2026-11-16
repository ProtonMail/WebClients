// idb reads the ambient global `indexedDB`, so install fake-indexeddb as an import side-effect.
// Tests stay isolated by opening a fresh, uniquely-named database each time.
import { generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import 'fake-indexeddb/auto';
import type { IDBPDatabase } from 'idb';

import type { ESBaseMessage } from '../../models/encryptedSearch';
import { openContentSearchDB } from '../db/open';
import type { Database } from '../db/schema';
import type { MessageCacheEntry, OpenMessageCacheTransaction } from './MessageCache';
import { MessageCache } from './MessageCache';

const metadata = (id: string, overrides: Partial<ESBaseMessage> = {}) =>
    ({ ID: id, Subject: `subject ${id}`, Unread: 0, Time: 1000, ...overrides }) as ESBaseMessage;

const entry = (id: string, overrides: Partial<MessageCacheEntry> = {}): MessageCacheEntry => ({
    ...metadata(id),
    decryptedBody: `body ${id}`,
    decryptedSubject: undefined,
    mimeType: undefined,
    ...overrides,
});

describe('MessageCache', () => {
    let db: IDBPDatabase<Database>;
    let messageCache: MessageCache;

    let dbCounter = 0;

    beforeEach(async () => {
        db = await openContentSearchDB(`message-cache-test-user-${dbCounter++}`);
        messageCache = new MessageCache(await generateAndImportKey());
    });

    afterEach(() => {
        db.close();
    });

    const commit = async (txn: OpenMessageCacheTransaction) => {
        const sealed = await txn.encrypt(db);
        const writeTxn = db.transaction('message_cache', 'readwrite');
        sealed.write(writeTxn);
        await writeTxn.done;
    };

    const addMessages = async (...entries: MessageCacheEntry[]) => {
        const txn = messageCache.startTransaction();
        for (const e of entries) {
            txn.addMessage(e);
        }
        await commit(txn);
    };

    it('encrypts added messages and reads them back', async () => {
        await addMessages(entry('a'), entry('b'));

        const stored = await db.get('message_cache', 'a');
        expect(stored).toBeDefined();
        expect(new TextDecoder().decode(stored)).not.toContain('body a');

        const messages = await messageCache.readMessages(['a', 'b', 'missing'], db);
        expect(messages).toEqual(
            new Map([
                ['a', entry('a')],
                ['b', entry('b')],
            ])
        );
    });

    it('binds the ciphertext to the message id', async () => {
        await addMessages(entry('a'));
        await db.put('message_cache', (await db.get('message_cache', 'a'))!, 'b');

        await expect(messageCache.readMessages(['b'], db)).rejects.toThrow();
    });

    it('updates the metadata of a cached message, keeping the body', async () => {
        await addMessages(entry('a', { decryptedSubject: 'decrypted subject', Unread: 1 }));

        const txn = messageCache.startTransaction();
        txn.updateMetadata(metadata('a', { Unread: 0, LabelIDs: ['label'] }));
        await commit(txn);

        const messages = await messageCache.readMessages(['a'], db);
        expect(messages.get('a')).toEqual(
            entry('a', { decryptedSubject: 'decrypted subject', Unread: 0, LabelIDs: ['label'] })
        );
    });

    it('ignores metadata updates for messages not in the cache', async () => {
        const txn = messageCache.startTransaction();
        txn.updateMetadata(metadata('a'));
        await commit(txn);

        expect(await db.get('message_cache', 'a')).toBeUndefined();
    });

    it('removes messages', async () => {
        await addMessages(entry('a'), entry('b'));

        const txn = messageCache.startTransaction();
        txn.removeMessage('a');
        await commit(txn);

        const messages = await messageCache.readMessages(['a', 'b'], db);
        expect(Array.from(messages.keys())).toEqual(['b']);
    });

    describe('multiple changes to the same message in one transaction', () => {
        it('merges a metadata update into a message added earlier', async () => {
            const txn = messageCache.startTransaction();
            txn.addMessage(entry('a', { Unread: 1 }));
            txn.updateMetadata(metadata('a', { Unread: 0 }));
            await commit(txn);

            expect((await messageCache.readMessages(['a'], db)).get('a')).toEqual(entry('a', { Unread: 0 }));
        });

        it('merges consecutive metadata updates', async () => {
            await addMessages(entry('a'));

            const txn = messageCache.startTransaction();
            txn.updateMetadata(metadata('a', { Unread: 1 }));
            // partial update, to check the earlier update isn't overwritten
            txn.updateMetadata({ ID: 'a', LabelIDs: ['label'] } as ESBaseMessage);
            await commit(txn);

            expect((await messageCache.readMessages(['a'], db)).get('a')).toEqual(
                entry('a', { Unread: 1, LabelIDs: ['label'] })
            );
        });

        it('lets an add supersede an earlier metadata update', async () => {
            await addMessages(entry('a'));

            const txn = messageCache.startTransaction();
            txn.updateMetadata(metadata('a', { Unread: 1 }));
            txn.addMessage(entry('a', { decryptedBody: 'new body' }));
            await commit(txn);

            expect((await messageCache.readMessages(['a'], db)).get('a')).toEqual(
                entry('a', { decryptedBody: 'new body' })
            );
        });

        it('ignores a metadata update after a remove', async () => {
            await addMessages(entry('a'));

            const txn = messageCache.startTransaction();
            txn.removeMessage('a');
            txn.updateMetadata(metadata('a', { Unread: 1 }));
            await commit(txn);

            expect(await db.get('message_cache', 'a')).toBeUndefined();
        });

        it('removes a message added earlier', async () => {
            const txn = messageCache.startTransaction();
            txn.addMessage(entry('a'));
            txn.removeMessage('a');
            await commit(txn);

            expect(await db.get('message_cache', 'a')).toBeUndefined();
        });

        it('re-adds a message removed earlier', async () => {
            await addMessages(entry('a'));

            const txn = messageCache.startTransaction();
            txn.removeMessage('a');
            txn.addMessage(entry('a', { decryptedBody: 'new body' }));
            await commit(txn);

            expect((await messageCache.readMessages(['a'], db)).get('a')).toEqual(
                entry('a', { decryptedBody: 'new body' })
            );
        });
    });

    it('does not accept changes after encrypt', async () => {
        const txn = messageCache.startTransaction();
        await txn.encrypt(db);

        expect(() => txn.addMessage(entry('a'))).toThrow('transaction has been consumed');
        expect(() => txn.updateMetadata(metadata('a'))).toThrow('transaction has been consumed');
        expect(() => txn.removeMessage('a')).toThrow('transaction has been consumed');
        await expect(txn.encrypt(db)).rejects.toThrow('transaction has been consumed');
    });

    it('does not write before encrypt', () => {
        const txn = messageCache.startTransaction();
        const writeTxn = db.transaction('message_cache', 'readwrite');

        expect(() => (txn as any).write(writeTxn)).toThrow('Call encrypt() first');
    });
});
