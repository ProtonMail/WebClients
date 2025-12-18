import { useMemo } from 'react';

import { useUser } from '@proton/account/user/hooks';

import { useLumoSelector } from '../redux/hooks';
import { selectMasterKey } from '../redux/selectors';
import { SearchService } from '../services/search/searchService';

/**
 * Hook that provides a SearchService instance.
 * 
 * The SearchService automatically:
 * 1. Gets the master key from Redux store
 * 2. Generates a search index key if one doesn't exist
 * 3. Stores it wrapped with the master key in IndexedDB
 * 4. Uses the search index key to derive the DEK for encrypting search data
 * 
 * @returns SearchService instance, or null if user not available
 */
export function useSearchService(): SearchService | null {
    const [user] = useUser();
    const userId = user?.ID;
    const masterKey = useLumoSelector(selectMasterKey);

    return useMemo(() => {
        // Need both userId and masterKey to be available
        if (!userId || !masterKey) {
            return null;
        }

        return SearchService.get(userId);
    }, [userId, masterKey]);
}

