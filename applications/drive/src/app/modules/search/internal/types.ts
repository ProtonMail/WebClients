export type UserId = string & { readonly __brand: 'SearchUserId' };
export type ClientId = string & { readonly __brand: 'SearchClientId' };

export type SearchModuleState = {
    // Whether search indexes are being built initially.
    isInitialIndexing: boolean;
    // Whether the search module is ready to receive any search queries.
    isSearchable: boolean;
};

// TODO: Define SearchQuery and SearchResult shapes once the WASM searcher is wired up.
