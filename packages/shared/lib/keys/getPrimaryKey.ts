import { CachedKey } from '../interfaces';

/**
 * Get primary address or user key.
 * The API returns a sorted list, with the first key being the primary key.
 */
export default (keys: CachedKey[] = []): CachedKey | undefined => {
    return keys[0];
};
