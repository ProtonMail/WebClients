// An interface to allow using either the encrypted-search or foundation-search in the search view.
export type SearchViewModelAdapter = {
    isSearchEnabled: boolean;
    isComputingSearchIndex: boolean;
    startIndexing: () => void;
    isSearching: boolean;
    resultUids: string[];
    refreshResults: () => void;
};
