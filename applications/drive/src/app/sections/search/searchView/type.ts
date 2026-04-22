import type { IndexingProgress } from '../../../modules/search';

// An interface to allow using either the encrypted-search or foundation-search in the search view.
export type SearchViewModelAdapter = {
    isSearchAvailable: boolean;
    isSearchEnabled: boolean;
    isSearchable: boolean;
    startIndexing: () => void;
    isSearching: boolean;
    resultUids: string[];
    refreshResults: () => void;
    indexingProgress: IndexingProgress;
};
