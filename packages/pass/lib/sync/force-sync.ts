import type { AnyStorage } from '../../types';
import { logger } from '../../utils/logger';

export type ForceSyncEntry = { done: boolean; attempts: number; lastAttemptAt: number };

/** One key per account: `forceSync::<localID>` */
export const FORCE_SYNC_STORAGE_PREFIX = 'forceSync';
export type ForceSyncStorageKey = `${typeof FORCE_SYNC_STORAGE_PREFIX}::${number}`;

export const getForceSyncStorageKey = (localID: number = 0): ForceSyncStorageKey =>
    `${FORCE_SYNC_STORAGE_PREFIX}::${localID}`;

export const INITIAL_FORCE_SYNC_ENTRY: ForceSyncEntry = { done: false, attempts: 0, lastAttemptAt: 0 };

export type ForceSyncStore = {
    read: () => Promise<ForceSyncEntry>;
    write: (entry: ForceSyncEntry) => Promise<void>;
};

type ForceSyncStoreOptions<StorageKey extends string> = {
    storage: AnyStorage<Record<StorageKey, string>>;
    getStorageKey: () => StorageKey;
};

export const createForceSyncStore = <StorageKey extends string>({
    storage,
    getStorageKey,
}: ForceSyncStoreOptions<StorageKey>): ForceSyncStore => ({
    read: async () => {
        try {
            const raw = await storage.getItem(getStorageKey());
            return raw ? { ...INITIAL_FORCE_SYNC_ENTRY, ...JSON.parse(raw) } : INITIAL_FORCE_SYNC_ENTRY;
        } catch {
            return INITIAL_FORCE_SYNC_ENTRY;
        }
    },

    write: async (entry) => {
        try {
            await storage.setItem(getStorageKey(), JSON.stringify(entry));
        } catch (err) {
            logger.warn('[ForceSync] Failed persisting state', err);
        }
    },
});
