import type { createStorageKeyService } from './service';

export type StorageKeyService = ReturnType<typeof createStorageKeyService>;

let storageKey: StorageKeyService | undefined;

export const registerStorageKey = (service: StorageKeyService) => {
    storageKey = service;
};

export const getStorageKey = (): StorageKeyService => {
    if (!storageKey) throw new Error('Storage key is not initialized');
    return storageKey;
};
