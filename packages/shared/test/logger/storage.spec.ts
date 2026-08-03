import { LOGGER_DB_PREFIX } from '../../lib/logger/constants';
import { IndexedDBStorage } from '../../lib/logger/storage';
import type { LogEntry } from '../../lib/logger/types';

let counter = 0;
const uniqueId = () => `${Date.now()}-${counter++}`;

const entry = (timestamp: number, data = `payload-${timestamp}`): LogEntry => ({
    id: `${timestamp}-${Math.random().toString(36).slice(2, 11)}`,
    timestamp,
    level: 'info',
    data,
});

describe('IndexedDBStorage', () => {
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
        expect(names).toContain(`${LOGGER_DB_PREFIX}storage-spec${id}`);
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
        expect(names).toContain(`${LOGGER_DB_PREFIX}namedabc`);
    });
});
