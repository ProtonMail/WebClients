import { createContext, useContext, useState } from 'react';

import useSearchLibrary from './useSearchLibrary';
import { ESLink } from './types';

function useSearchResultsProvider() {
    const { encryptedSearch, getESDBStatus } = useSearchLibrary();
    const { dbExists } = getESDBStatus();

    const [query, setQuery] = useState<string>('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<ESLink[]>([]);

    const searchStarted = (query: string) => {
        setQuery(query);
        setIsSearching(true);
    };

    const runSearch = async (query: string) => {
        searchStarted(query);
        await encryptedSearch((results: ESLink[]) => {
            setResults(results);
        }).finally(() => {
            setIsSearching(false);
        });
    };

    return {
        runSearch,
        dbExists,
        query,
        isSearching,
        results,
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
