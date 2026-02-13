import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import type { NodeType } from '@proton/drive';
import type { SORT_DIRECTION } from '@proton/shared/lib/constants';

import type { SortField } from '../../modules/sorting';
import { type SortConfig, sortItems } from '../../modules/sorting';
import type { EffectiveRole } from '../../utils/sdk/getNodeEffectiveRole';
import { defaultSort, getSearchResultItemSortValue } from './searchResultItems.sorting';

export type SearchResultItemUI = {
    nodeUid: string;
    parentUid: string | undefined;
    name: string;
    type: NodeType;
    role: EffectiveRole;
    size: number | undefined;
    mediaType: string | undefined;
    thumbnailId: string | undefined;
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

    addSearchResultItem: (item: SearchResultItemUI) => void;

    // Remove unused nodes from the store from previous search queries.
    cleanupStaleItems: (loadedUids: Set<string>) => void;

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

            addSearchResultItem: (item: SearchResultItemUI) => {
                set((state) => {
                    const keyUid = getKeyUid(item);
                    const isExistingItem = state.searchResultItems.has(keyUid);

                    if (isExistingItem) {
                        const newItems = new Map(state.searchResultItems);
                        newItems.set(keyUid, item);

                        return {
                            searchResultItems: newItems,
                        };
                    }

                    // Reset sorting
                    const items = state.getAllSearchResultItems();
                    const sortedItemUids = sortItems(
                        items,
                        state.sortConfig,
                        state.direction,
                        getSearchResultItemSortValue,
                        getKeyUid
                    );

                    const newSearchResultItems = new Map(state.searchResultItems);
                    newSearchResultItems.set(keyUid, item);

                    return {
                        searchResultItems: newSearchResultItems,
                        sortedItemUids,
                    };
                });
            },

            cleanupStaleItems: (loadedUids: Set<string>) => {
                set((state) => {
                    const newItems = new Map(state.searchResultItems);

                    // Find items of the specified type that weren't in the loaded set
                    for (const [uid, item] of state.searchResultItems) {
                        const shouldCleanup = !loadedUids.has(getKeyUid(item));

                        if (shouldCleanup) {
                            newItems.delete(uid);
                        }
                    }

                    // Reset sorting
                    const items = Array.from(newItems.values());
                    const sortedItemUids = sortItems(
                        items,
                        state.sortConfig,
                        state.direction,
                        getSearchResultItemSortValue,
                        getKeyUid
                    );

                    return {
                        searchResultItems: newItems,
                        sortedItemUids,
                    };
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
