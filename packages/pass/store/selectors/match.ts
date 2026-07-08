import { createSelector } from '@reduxjs/toolkit';

import { isActive, isTrashed } from '@proton/pass/lib/items/item.predicates';
import { filterItemsByShareId, filterItemsByType, sortItems } from '@proton/pass/lib/items/item.utils';
import { searchItems } from '@proton/pass/lib/search/match-items';
import type { SelectItemsOptions } from '@proton/pass/lib/search/types';
import { itemsFromSelection, selectAllItems, selectItems, selectVisibleItems } from '@proton/pass/store/selectors/items';
import { selectVisibleSecureLinkedItems, selectVisibleSecureLinksCount } from '@proton/pass/store/selectors/secure-links';
import { selectSharedByMe, selectSharedWithMe } from '@proton/pass/store/selectors/shared';
import { selectState } from '@proton/pass/store/selectors/utils';
import type { State } from '@proton/pass/store/types';
import type { ItemRevision } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

export type ItemsSearchResults = {
    filtered: ItemRevision[];
    searched: ItemRevision[];
    totalCount: number;
};

const selectTrashedFilter = (_: State, { trashed }: SelectItemsOptions) => trashed;
const selectShareIdFilter = (_: State, { shareId }: SelectItemsOptions) => shareId;
const selectSortFilter = (_: State, { sort }: SelectItemsOptions) => sort;
const selectSearchFilter = (_: State, { search }: SelectItemsOptions) => search;
const selectTypeFilter = (_: State, { type }: SelectItemsOptions) => type;
const selectVisibleFilter = (_: State, { visible }: SelectItemsOptions) => visible;

/** Search result selector is organized to separate sort from search, as sorting
 * can be computationally expensive when the number of items is high. The `search`
 * is expected to change more frequently than the shareId / sortOption */
export const createMatchItemsSelector = () => {
    const selectItemsByVisibility = createSelector([selectState, selectVisibleFilter], (state, visible) =>
        (visible ? selectVisibleItems : selectAllItems)(state)
    );

    const selectSortedItemsByShareId = createSelector(
        [selectItemsByVisibility, selectTrashedFilter, selectShareIdFilter, selectSortFilter],
        (items, trashed, shareId, sort) =>
            pipe(filterItemsByShareId(shareId), sortItems(sort))(items.filter(trashed ? isTrashed : isActive))
    );

    return createSelector([selectSortedItemsByShareId, selectSearchFilter, selectTypeFilter], (items, search, type): ItemsSearchResults => {
        const searched = searchItems(items, search);
        const filtered = filterItemsByType(type)(searched);
        return { filtered, searched, totalCount: items.length };
    });
};

export const createMatchSharedByMeSelector = () =>
    createSelector([selectSharedByMe, selectSearchFilter], (sorted, search): ItemsSearchResults => {
        const searched = searchItems(sorted, search);
        return { searched, filtered: searched, totalCount: sorted.length };
    });

export const createMatchSharedWithMeSelector = () =>
    createSelector([selectSharedWithMe, selectSearchFilter], (sorted, search): ItemsSearchResults => {
        const searched = searchItems(sorted, search);
        return { searched, filtered: searched, totalCount: sorted.length };
    });

export const createMatchSecureLinksSelector = () => {
    const selectSortedSecureLinkItems = createSelector(
        [selectItems, selectVisibleSecureLinkedItems, selectVisibleSecureLinksCount],
        (items, secureLinks, secureLinksCount) => {
            const secureLinkItems = itemsFromSelection(secureLinks)(items);
            const sorted = sortItems('recent')(secureLinkItems);
            return { sorted, totalCount: secureLinksCount };
        }
    );

    return createSelector([selectSortedSecureLinkItems, selectSearchFilter], ({ sorted, totalCount }, search): ItemsSearchResults => {
        const searched = searchItems(sorted, search);
        return { searched, filtered: searched, totalCount };
    });
};
