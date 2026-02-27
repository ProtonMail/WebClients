import { createContext, useContext, useState } from 'react';

import metrics from '@proton/metrics';

import type { ESLink } from './types';
import useSearchLibrary from './useSearchLibrary';

function useSearchResultsProvider() {
    const {
        encryptedSearch,
        esStatus,
        enableEncryptedSearch,
        cacheIndexedDB,
        esStatus: { esSupported, isEnablingEncryptedSearch },
    } = useSearchLibrary();
    const { dbExists } = esStatus;

    const [query, setQuery] = useState<string>('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<ESLink[]>([]);

    const searchStarted = (query: string) => {
        setQuery(query);
        setIsSearching(true);
    };

    const runSearch = async (query: string) => {
        searchStarted(query);

        const startTime = performance.now();
        await encryptedSearch((results: ESLink[]) => {
            setResults(results);
        }).finally(() => {
            setIsSearching(false);

            const durationInSeconds = (performance.now() - startTime) / 1000;
            metrics.drive_search_query_time_histogram.observe({
                Labels: {
                    searchVersion: 'legacy',
                },
                Value: durationInSeconds,
            });
        });
    };

    return {
        runSearch,
        dbExists,
        query,
        isSearching,
        results,
        isSearchSupported: esSupported,
        enableSearch: enableEncryptedSearch,
        isEnablingSearch: isEnablingEncryptedSearch,
        cachedSearchDB: cacheIndexedDB,
    };
}

const SearchResultsContext = createContext<ReturnType<typeof useSearchResultsProvider> | null>(null);

export function SearchResultsProvider({ children }: { children: React.ReactNode }) {
    const providerState = useSearchResultsProvider();
    return <SearchResultsContext.Provider value={providerState}>{children}</SearchResultsContext.Provider>;
}

export default function useSearchResults() {
    const state = useContext(SearchResultsContext);
    if (!state) {
        throw new Error('Trying to use uninitialized SearchResultsProvider');
    }
    return state;
}
