import { useCache } from 'react-components';
import { BinaryResult } from 'pmcrypto';

const CACHE_KEY = 'Attachments';

// TODO: Use a listenable cache to be able to get reactive data from views

export type AttachmentsCache = Map<string, BinaryResult>;

export const useAttachmentsCache = (): AttachmentsCache => {
    const globalCache = useCache();

    if (!globalCache.has(CACHE_KEY)) {
        globalCache.set(CACHE_KEY, new Map());
    }

    return globalCache.get(CACHE_KEY);
};
