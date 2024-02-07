import { MAX_LOCAL_STORAGE_SIZE } from '@proton/pass/constants';

export const getLocalStorageQuota = async (): Promise<number> => {
    try {
        const { quota } = await navigator.storage.estimate();
        return quota ? Math.min(quota, MAX_LOCAL_STORAGE_SIZE) : MAX_LOCAL_STORAGE_SIZE;
    } catch {
        return MAX_LOCAL_STORAGE_SIZE;
    }
};
