import { deleteDB, openDB } from 'idb';

import { LOGGER_DB_PREFIX } from './constants';
import { IndexedDBStorage } from './storage';
import type { LogEntry } from './types';

let counter = 0;
const uniqueId = () => `${Date.now()}-${counter++}`;

const entry = (timestamp: number, data = `payload-${timestamp}`): LogEntry => ({
    id: `${timestamp}-${Math.random().toString(36).slice(2, 11)}`,
    timestamp,
    level: 'info',
    data,
});

describe.skip('IndexedDBStorage', () => {
    const created: IndexedDBStorage[] = [];

    const createStorage = () => {
        const storage = new IndexedDBStorage('storage-spec', uniqueId());
        created.push(storage);
        return storage;
    };

    afterEach(async () => {
        await Promise.all(created.splice(0).map((storage) => storage.deleteDatabase().catch(() => {})));
    });

    it('stores and retrieves entries in ascending timestamp order', async () => {
        const storage = createStorage();

        await storage.store(entry(300));
        await storage.store(entry(100));
        await storage.store(entry(200));

        expect((await storage.retrieve()).map(({ timestamp }) => timestamp)).toEqual([100, 200, 300]);
    });

    it('counts entries', async () => {
        const storage = createStorage();
        expect(await storage.count()).toBe(0);

        await storage.store(entry(1));
        await storage.store(entry(2));

        expect(await storage.count()).toBe(2);
    });

    it('clears entries without destroying the database', async () => {
        const storage = createStorage();
        await storage.store(entry(1));

        await storage.clear();

        expect(await storage.count()).toBe(0);
        // The database survives, so the next write does not need to recreate it.
        await storage.store(entry(2));
        expect(await storage.count()).toBe(1);
    });

    it('removes the oldest entries', async () => {
        const storage = createStorage();
        await storage.store(entry(100));
        await storage.store(entry(200));
        await storage.store(entry(300));

        await storage.removeOldest(2);

        expect((await storage.retrieve()).map(({ timestamp }) => timestamp)).toEqual([300]);
    });

    it('ignores a non-positive removeOldest count', async () => {
        const storage = createStorage();
        await storage.store(entry(100));

        await storage.removeOldest(0);
        await storage.removeOldest(-5);

        expect(await storage.count()).toBe(1);
    });

    it('removes entries older than a timestamp and reports how many', async () => {
        const storage = createStorage();
        await storage.store(entry(100));
        await storage.store(entry(200));
        await storage.store(entry(300));

        const removed = await storage.removeOlderThan(250);

        expect(removed).toBe(2);
        expect((await storage.retrieve()).map(({ timestamp }) => timestamp)).toEqual([300]);
    });

    it('keeps the database when every entry expires', async () => {
        const id = uniqueId();
        const storage = new IndexedDBStorage('storage-spec', id);
        created.push(storage);
        await storage.store(entry(100));

        await storage.removeOlderThan(Number.MAX_SAFE_INTEGER);

        expect(await storage.count()).toBe(0);
        const names = (await indexedDB.databases()).map((db) => db.name);
        expect(names).toContain(`${LOGGER_DB_PREFIX}storage-spec-${id}`);
    });

    it('reopens after close', async () => {
        const storage = createStorage();
        await storage.store(entry(100));

        await storage.close();

        expect(await storage.count()).toBe(1);
    });

    it('names the database from the logger name and id', async () => {
        const storage = new IndexedDBStorage('named', 'abc');
        created.push(storage);

        await storage.store(entry(1));

        const names = (await indexedDB.databases()).map((db) => db.name);
        expect(names).toContain(`${LOGGER_DB_PREFIX}named-abc`);
    });

    it('closes its connection when another tab needs a version change', async () => {
        const id = uniqueId();
        const storage = new IndexedDBStorage('storage-spec', id);
        created.push(storage);
        // Writing leaves a connection open, which is what would hold the other tab up.
        await storage.store(entry(100));

        // Only resolves once our connection closes, which is what `blocking` is for.
        const upgraded = await openDB(`${LOGGER_DB_PREFIX}storage-spec-${id}`, 2, { upgrade: () => {} });

        try {
            expect(upgraded.version).toBe(2);
        } finally {
            upgraded.close();
        }
    });

    it('lets another tab delete the database it is holding open', async () => {
        const id = uniqueId();
        const dbName = `${LOGGER_DB_PREFIX}storage-spec-${id}`;
        const storage = new IndexedDBStorage('storage-spec', id);
        created.push(storage);
        await storage.store(entry(100));

        // Deleting is blocked by open connections, so this only resolves because `blocking`
        // closes ours. A delete on logout depends on it.
        await deleteDB(dbName);

        const names = (await indexedDB.databases()).map((db) => db.name);
        expect(names).not.toContain(dbName);
    });

    it('fails rather than hangs when the database was left at a newer version', async () => {
        const id = uniqueId();
        // A tab running a future version of the app upgraded the database under us.
        const newer = await openDB(`${LOGGER_DB_PREFIX}storage-spec-${id}`, 2, { upgrade: () => {} });
        newer.close();

        const storage = new IndexedDBStorage('storage-spec', id);
        created.push(storage);

        await expect(storage.store(entry(100))).rejects.toThrow();
        // A failed open must still be deletable, which is what teardown relies on.
        await expect(storage.deleteDatabase()).resolves.toBeUndefined();
    });
});
