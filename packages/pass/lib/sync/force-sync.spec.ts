import type { AnyStorage } from '../../types';
import { INITIAL_FORCE_SYNC_ENTRY, createForceSyncStore } from './force-sync';

type Key = `forceSync::${number}`;

const createStorage = (initial: Record<string, string> = {}) => {
    const data = { ...initial };

    return {
        data,
        storage: {
            getItem: async (key: string) => data[key] ?? null,
            setItem: async (key: string, value: string) => {
                data[key] = value;
            },
            removeItem: async (key: string) => {
                delete data[key];
            },
            clear: async () => {
                Object.keys(data).forEach((key) => delete data[key]);
            },
        } as unknown as AnyStorage<Record<Key, string>>,
    };
};

describe('createForceSyncStore', () => {
    test('reads and writes against the key for the active account', async () => {
        const { data, storage } = createStorage();
        let localID = 0;
        const store = createForceSyncStore<Key>({ storage, getStorageKey: () => `forceSync::${localID}` });

        await store.write({ done: true, attempts: 1, lastAttemptAt: 42 });
        expect(Object.keys(data)).toEqual(['forceSync::0']);

        /** A second account must not inherit the first account's entry */
        localID = 1;
        expect(await store.read()).toEqual(INITIAL_FORCE_SYNC_ENTRY);

        localID = 0;
        expect(await store.read()).toEqual({ done: true, attempts: 1, lastAttemptAt: 42 });
    });

    test('falls back to the initial entry on missing or corrupt data', async () => {
        const { storage } = createStorage({ 'forceSync::0': '{{{not json' });
        const store = createForceSyncStore<Key>({ storage, getStorageKey: () => 'forceSync::0' });

        expect(await store.read()).toEqual(INITIAL_FORCE_SYNC_ENTRY);
    });

    test('backfills missing fields from a partial entry', async () => {
        const { storage } = createStorage({ 'forceSync::0': JSON.stringify({ done: true }) });
        const store = createForceSyncStore<Key>({ storage, getStorageKey: () => 'forceSync::0' });

        expect(await store.read()).toEqual({ done: true, attempts: 0, lastAttemptAt: 0 });
    });
});
