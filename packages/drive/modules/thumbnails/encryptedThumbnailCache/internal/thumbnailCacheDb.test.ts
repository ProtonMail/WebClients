import { IDBFactory } from 'fake-indexeddb';
import 'fake-indexeddb/auto';

import { ThumbnailCacheDb } from './thumbnailCacheDb';

const bytes = (values: number[]) => new Uint8Array(values) as Uint8Array<ArrayBuffer>;
const sized = (length: number) => new Uint8Array(length) as Uint8Array<ArrayBuffer>;

describe('ThumbnailCacheDb', () => {
    beforeEach(() => {
        // Fresh, isolated set of databases per test.
        indexedDB = new IDBFactory();
    });

    describe('entries', () => {
        it('round-trips stored ciphertext', async () => {
            const db = await ThumbnailCacheDb.open('user-1');

            await db.putEntry('k1', bytes([1, 2, 3]));
            const got = await db.getEntry('k1');

            expect(got && Array.from(got)).toEqual([1, 2, 3]);
            db.close();
        });

        it('returns undefined for a missing entry', async () => {
            const db = await ThumbnailCacheDb.open('user-1');

            expect(await db.getEntry('nope')).toBeUndefined();
            db.close();
        });

        it('overwrites an existing key in place', async () => {
            const db = await ThumbnailCacheDb.open('user-1');

            await db.putEntry('k1', bytes([1]));
            await db.putEntry('k1', bytes([2, 2]));

            const got = await db.getEntry('k1');
            expect(got && Array.from(got)).toEqual([2, 2]);
            db.close();
        });
    });

    describe('wrapped key', () => {
        it('round-trips the wrapped key', async () => {
            const db = await ThumbnailCacheDb.open('user-1');

            expect(await db.getWrappedKey()).toBeUndefined();
            await db.setWrappedKey('wrapped-abc');
            expect(await db.getWrappedKey()).toBe('wrapped-abc');
            db.close();
        });

        it('keeps the wrapped key when clearData wipes entries', async () => {
            const db = await ThumbnailCacheDb.open('user-1');
            await db.setWrappedKey('wrapped-abc');
            await db.putEntry('k1', bytes([1, 2, 3]));

            await db.clearData();

            expect(await db.getWrappedKey()).toBe('wrapped-abc');
            expect(await db.getEntry('k1')).toBeUndefined();
            db.close();
        });
    });

    describe('eviction', () => {
        it('evicts the oldest entries past the total-size cap', async () => {
            const db = await ThumbnailCacheDb.open('user-1');
            const ONE_MB = 1024 * 1024;
            // The size cap is 35MB. 36 x 1MB overflows it by one entry, so only the
            // oldest is evicted.
            const count = 36;

            for (let i = 0; i < count; i++) {
                await db.putEntry(`k-${i}`, sized(ONE_MB));
            }

            expect(await db.getEntry('k-0')).toBeUndefined();
            expect(await db.getEntry('k-1')).toBeDefined();
            expect(await db.getEntry(`k-${count - 1}`)).toBeDefined();
            db.close();
        });

        it('re-putting the same key does not evict other entries', async () => {
            const db = await ThumbnailCacheDb.open('user-1');

            await db.putEntry('keep', bytes([1]));
            // Re-putting the same key replaces its queue entry instead of appending,
            // so the cache stays at 2 entries and `keep` is never evicted.
            for (let i = 0; i < 550; i++) {
                await db.putEntry('hot', bytes([i % 256]));
            }

            expect(await db.getEntry('keep')).toBeDefined();
            expect(await db.getEntry('hot')).toBeDefined();
            db.close();
        });
    });

    describe('isolation & persistence', () => {
        it('isolates entries per user (separate databases)', async () => {
            const dbA = await ThumbnailCacheDb.open('user-a');
            await dbA.putEntry('k1', bytes([1]));

            const dbB = await ThumbnailCacheDb.open('user-b');
            expect(await dbB.getEntry('k1')).toBeUndefined();

            dbA.close();
            dbB.close();
        });

        it('persists entries across reopen', async () => {
            const db = await ThumbnailCacheDb.open('user-1');
            await db.putEntry('k1', bytes([1, 2, 3]));
            db.close();

            const reopened = await ThumbnailCacheDb.open('user-1');
            const got = await reopened.getEntry('k1');
            expect(got && Array.from(got)).toEqual([1, 2, 3]);
            reopened.close();
        });
    });
});
