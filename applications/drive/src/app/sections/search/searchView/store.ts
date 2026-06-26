import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { NodeType } from '@proton/drive';
import type { EffectiveRole } from '@proton/drive/modules/nodes';
import type { SORT_DIRECTION } from '@proton/shared/lib/constants';

import type { SortField } from '../../../modules/sorting';
import { type SortConfig, sortItems } from '../../../modules/sorting';
import { defaultSort, getSearchResultItemSortValue } from './searchResultItems.sorting';

export type SearchResultItemUI = {
    nodeUid: string;
    parentUid: string | undefined;
    name: string;
    type: NodeType;
    role: EffectiveRole;
    size: number | undefined;
    mediaType: string | undefined;
    activeRevisionUid: string | undefined;
    modificationTime: Date;
    location: string;
    haveSignatureIssues: boolean;
};

export type SearchViewStore = {
    // All the UI item to be rendered but not sorted.
    searchResultItems: Map<string, SearchResultItemUI>;
    sortedItemUids: string[];

    // Whether some node loaded in the view was modified. The store state
    // is not in sync anymore with the backend. Nodes will need to be
    // re-fetched to sync the state.
    dirty: boolean;

    sortField: SortField;
    direction: SORT_DIRECTION;
    sortConfig: SortConfig;
    setSorting: (params: { sortField: SortField; direction: SORT_DIRECTION; sortConfig: SortConfig }) => void;

    // Nodes are being fetched and converted to searchResultItems UI items.
    loading: boolean;
    setLoading: (loading: boolean) => void;
    hasEverLoaded: boolean;

    // Reset all items and loading state for a new search.
    clearAll: () => void;

    addSearchResultItem: (item: SearchResultItemUI) => void;
    addSearchResultItems: (items: SearchResultItemUI[]) => void;

    getSearchResultItem: (uid: string) => SearchResultItemUI | undefined;
    getAllSearchResultItems: () => SearchResultItemUI[];

    markStoreAsDirty: (dirty: boolean) => void;
};

export const getKeyUid = (item: SearchResultItemUI) => item.nodeUid;

// A store for the whole search result view.
export const useSearchViewStore = create<SearchViewStore>()(
    devtools(
        (set, get) => ({
            searchResultItems: new Map(),
            hasEverLoaded: false,
            dirty: false,

            sortField: defaultSort.sortField,
            direction: defaultSort.direction,
            sortConfig: defaultSort.sortConfig || [],
            sortedItemUids: [],
            loading: false,

            markStoreAsDirty: (dirty) => {
                set(() => {
                    return {
                        dirty,
                    };
                });
            },

            clearAll: () => {
                set({
                    searchResultItems: new Map(),
                    sortedItemUids: [],
                    loading: false,
                    hasEverLoaded: false,
                    dirty: false,
                });
            },

            addSearchResultItem: (item: SearchResultItemUI) => {
                set((state) => {
                    const newSearchResultItems = new Map(state.searchResultItems);
                    newSearchResultItems.set(getKeyUid(item), item);

                    const allItems = Array.from(newSearchResultItems.values());
                    const sortedItemUids = sortItems(
                        allItems,
                        state.sortConfig,
                        state.direction,
                        getSearchResultItemSortValue,
                        getKeyUid
                    );

                    return {
                        searchResultItems: newSearchResultItems,
                        sortedItemUids,
                    };
                });
            },

            addSearchResultItems: (items: SearchResultItemUI[]) => {
                if (items.length === 0) {
                    return;
                }
                set((state) => {
                    const newSearchResultItems = new Map(state.searchResultItems);
                    for (const item of items) {
                        newSearchResultItems.set(getKeyUid(item), item);
                    }
                    const allItems = Array.from(newSearchResultItems.values());
                    const sortedItemUids = sortItems(
                        allItems,
                        state.sortConfig,
                        state.direction,
                        getSearchResultItemSortValue,
                        getKeyUid
                    );
                    return { searchResultItems: newSearchResultItems, sortedItemUids };
                });
            },

            getSearchResultItem: (uid: string) => get().searchResultItems.get(uid),
            getAllSearchResultItems: () => {
                const v = get().searchResultItems.values();
                return Array.from(v);
            },

            setSorting: ({ sortField, direction, sortConfig }) => {
                const state = get();
                const items = state.getAllSearchResultItems();
                const sortedItemUids = sortItems(items, sortConfig, direction, getSearchResultItemSortValue, getKeyUid);

                set({ sortField, direction, sortedItemUids });
            },

            setLoading: (loading: boolean) => {
                const state = get();
                set({ loading, hasEverLoaded: state.hasEverLoaded || loading });
            },
        }),
        {
            name: 'search-view-store',
        }
    )
);
