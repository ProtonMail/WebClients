import { useCallback, useMemo } from 'react';

import type { SearchViewModelAdapter } from '../type';

// An adapter to connect the search libray from foundation to the search ui.
export const useFoundationSearchAdapter = (): SearchViewModelAdapter => {
    // TODO: Integrate the new foundation search module.
    return {
        isSearchEnabled: false,
        isComputingSearchIndex: false,
        startIndexing: useCallback(() => {}, []),
        isSearching: false,
        resultUids: useMemo(() => [], []),
        refreshResults: useCallback(() => {}, []),
    };
};
