// idb reads the ambient global `indexedDB` (there is no way to inject a factory), so we install
// fake-indexeddb once here as an import side-effect rather than reassigning the global per test.
// Tests stay isolated by opening a fresh, uniquely-named database each time (see `freshDb`).
import { encryptData, generateAndImportKey } from '@protontech/crypto/subtle/aesGcm.ts';
import 'fake-indexeddb/auto';
import type { IDBPDatabase } from 'idb';

import { BlobCache } from '../cache/BlobCache';
import { openContentSearchDB } from '../db/open';
import type { Database } from '../db/schema';
import { EncryptedBlobTransaction, getBlobEncryptionContext } from './EncryptedBlobTransaction';

/**
 * The foundation-search events are wasm objects; the transaction only ever calls a
 * handful of methods on them, so we duck-type minimal fakes and cast at the call site.
 */
type FakeCached = { serialize: jest.Mock; free: jest.Mock };
const fakeCached = (payload: Uint8Array<ArrayBuffer>): FakeCached => ({
    serialize: jest.fn(() => payload),
    free: jest.fn(),
});

const loadEvent = (id: string) => ({
    id: () => id,
    sendCached: jest.fn(),
    send: jest.fn((_serdes: unknown, _blob: Uint8Array<ArrayBuffer>) => fakeCached(new Uint8Array([]))),
    sendEmpty: jest.fn(),
});

const saveEvent = (id: string, cached: FakeCached) => ({
    id: () => id,
    recv: jest.fn(() => cached),
});

const releaseEvent = (id: string) => ({
    id: () => id,
});

describe('EncryptedBlobTransaction', () => {
    let db: IDBPDatabase<Database>;
    let key: CryptoKey;

    const readwriteTxn = () => db.transaction(['config', 'index_blobs'], 'readwrite');

    // A unique database name per test gives isolation without touching the global indexedDB.
    let dbCounter = 0;

    beforeEach(async () => {
        db = await openContentSearchDB(`test-user-${dbCounter++}`);
        key = await generateAndImportKey();
    });

    /** Stores an encrypted blob straight into storage, bypassing the transaction. */
    const putEncryptedBlob = async (id: string, plaintext: Uint8Array<ArrayBuffer>) => {
        await db.put('index_blobs', await encryptData(key, plaintext, getBlobEncryptionContext(id)), id);
    };

    describe('write + read round trip', () => {
        it('encrypts on write and decrypts back on read, and bumps the revision', async () => {
            const plaintext = new Uint8Array([1, 2, 3, 4]);

            const writeTxn = await EncryptedBlobTransaction.start(undefined, db, key);
            writeTxn.handleSaveEvent(saveEvent('blob-1', fakeCached(plaintext)) as any);
            const sealed = await writeTxn.encrypt();
            const rw = readwriteTxn();
            await sealed.verifyAndWrite(rw);
            await rw.done;

            // stored blob is ciphertext, not the plaintext
            const stored = await db.get('index_blobs', 'blob-1');
            expect(stored).toBeDefined();
            expect(Array.from(stored!)).not.toEqual([1, 2, 3, 4]);
            // fresh transaction starts at revision 0, so writing lands on revision 1
            expect(await db.get('config', 'blobs_revision')).toBe(1);

            // a later transaction reads it back decrypted
            const readTxn = await EncryptedBlobTransaction.start(undefined, db, key);
            const event = loadEvent('blob-1');
            await readTxn.handleLoadEvent(event as any);

            expect(event.sendEmpty).not.toHaveBeenCalled();
            expect(event.send).toHaveBeenCalledTimes(1);
            expect(Array.from(event.send.mock.calls[0][1] as Uint8Array<ArrayBuffer>)).toEqual([1, 2, 3, 4]);
        });

        it('sends empty for a blob that is not in storage', async () => {
            const txn = await EncryptedBlobTransaction.start(undefined, db, key);
            const event = loadEvent('missing');

            await txn.handleLoadEvent(event as any);

            expect(event.sendEmpty).toHaveBeenCalledTimes(1);
            expect(event.send).not.toHaveBeenCalled();
        });
    });

    describe('reads reflect uncommitted transaction state', () => {
        it('returns a blob written earlier in the same transaction without hitting storage', async () => {
            const txn = await EncryptedBlobTransaction.start(undefined, db, key);
            txn.handleSaveEvent(saveEvent('pending', fakeCached(new Uint8Array([5, 6]))) as any);

            const event = loadEvent('pending');
            await txn.handleLoadEvent(event as any);

            expect(event.send).toHaveBeenCalledTimes(1);
            expect(Array.from(event.send.mock.calls[0][1] as Uint8Array<ArrayBuffer>)).toEqual([5, 6]);
            expect(event.sendEmpty).not.toHaveBeenCalled();
        });

        it('shadows a stored blob that is scheduled for deletion', async () => {
            await putEncryptedBlob('doomed', new Uint8Array([9]));

            const txn = await EncryptedBlobTransaction.start(undefined, db, key);
            txn.handleReleaseEvent(releaseEvent('doomed') as any);

            const event = loadEvent('doomed');
            await txn.handleLoadEvent(event as any);

            expect(event.sendEmpty).toHaveBeenCalledTimes(1);
            expect(event.send).not.toHaveBeenCalled();
        });
    });

    describe('blob cache', () => {
        it('serves a cached blob without touching storage or decrypting', async () => {
            const cache = new BlobCache();
            const txn = await EncryptedBlobTransaction.start(cache, db, key);
            const cached = fakeCached(new Uint8Array([1]));
            txn.handleSaveEvent(saveEvent('cached', cached) as any);

            const event = loadEvent('cached');
            await txn.handleLoadEvent(event as any);

            expect(event.sendCached).toHaveBeenCalledTimes(1);
            expect(event.sendCached.mock.calls[0][0]).toBe(cached);
            expect(event.send).not.toHaveBeenCalled();
            expect(event.sendEmpty).not.toHaveBeenCalled();
        });
    });

    describe('concurrency / revision guard', () => {
        it('throws when the revision changed while doing crypto', async () => {
            const txn = await EncryptedBlobTransaction.start(undefined, db, key);

            // another writer bumps the revision behind our back
            await db.put('config', 7, 'blobs_revision');

            await expect(txn.verify(db.transaction('config'))).rejects.toThrow('revision changed from 0 to 7');
        });

        it('does not throw when the revision is unchanged', async () => {
            const txn = await EncryptedBlobTransaction.start(undefined, db, key);
            await expect(txn.verify(db.transaction('config'))).resolves.toBeUndefined();
        });

        it('refuses to handle further events once consumed by encrypt()', async () => {
            // encrypt() consumes the transaction and hands back the write-only sealed one; the
            // original can no longer accept events (the type-state makes this a compile error too,
            // this guards the runtime case of a stale reference).
            const txn = await EncryptedBlobTransaction.start(undefined, db, key);
            txn.handleSaveEvent(saveEvent('blob', fakeCached(new Uint8Array([1]))) as any);
            await txn.encrypt();

            expect(() => txn.handleSaveEvent(saveEvent('after', fakeCached(new Uint8Array([2]))) as any)).toThrow(
                'transaction has been consumed'
            );
        });
    });

    describe('cleanup: verifyAndWrite deletes untracked blobs', () => {
        const writeBlobs = async (ids: string[]) => {
            const txn = await EncryptedBlobTransaction.start(undefined, db, key);
            for (const id of ids) {
                txn.handleSaveEvent(saveEvent(id, fakeCached(new Uint8Array([1]))) as any);
            }
            const sealed = await txn.encrypt();
            const rw = readwriteTxn();
            await sealed.verifyAndWrite(rw);
            await rw.done;
        };

        it('keeps tracked blobs and deletes the rest', async () => {
            await writeBlobs(['keep', 'drop']);

            const txn = await EncryptedBlobTransaction.start(undefined, db, key);
            txn.trackBlob('keep');
            const sealed = await txn.encrypt();
            const rw = readwriteTxn();
            await sealed.verifyAndWrite(rw);
            await rw.done;

            expect(await db.get('index_blobs', 'keep')).toBeDefined();
            expect(await db.get('index_blobs', 'drop')).toBeUndefined();
        });

        it('does not delete untracked blobs when nothing is tracked, to avoid wiping the whole index', async () => {
            await writeBlobs(['a', 'b']);

            const txn = await EncryptedBlobTransaction.start(undefined, db, key);
            const sealed = await txn.encrypt();
            const rw = readwriteTxn();

            // with no tracked blobs, verifyAndWrite must not treat every existing blob as untracked
            // and delete it; the untracked-deletion pass is skipped entirely.
            await sealed.verifyAndWrite(rw);
            await rw.done;

            // nothing was deleted
            expect(await db.get('index_blobs', 'a')).toBeDefined();
            expect(await db.get('index_blobs', 'b')).toBeDefined();
        });
    });
});
