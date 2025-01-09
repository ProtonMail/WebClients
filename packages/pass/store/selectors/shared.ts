import { createSelector } from '@reduxjs/toolkit';

import { sortItems } from '@proton/pass/lib/items/item.utils';
import { searchItems } from '@proton/pass/lib/search/match-items';
import { isShareManageable } from '@proton/pass/lib/shares/share.predicates';
import type { State } from '@proton/pass/store/types';
import { type SelectedItem } from '@proton/pass/types';

import type { ItemsSearchResults } from './items';
import { itemsFromSelection, selectAllItems, selectItems } from './items';
import { selectItemShares, selectShares } from './shares';

const selectSharedWithMe = createSelector([selectItemShares, selectItems], (itemShares, items) => {
    const selection: SelectedItem[] = itemShares.map(({ shareId, targetId: itemId }) => ({ shareId, itemId }));
    const sharedWithMe = itemsFromSelection(selection)(items);
    return sortItems('recent')(sharedWithMe);
});

export const selectSharedWithMeCount = createSelector(selectSharedWithMe, (items) => items.length);

/** "Sort before search" strategy */
export const selectSharedWithMeSearchResult = createSelector(
    [selectSharedWithMe, (_: State, search?: string) => search],
    (sorted, search): ItemsSearchResults => {
        const searched = searchItems(sorted, search);
        return { searched, filtered: searched, totalCount: sorted.length };
    }
);

const selectSharedByMe = createSelector([selectAllItems, selectShares], (items, shares) => {
    const sharedByMe = items.filter(({ shareId, shareCount = 0 }) => {
        if (shareCount <= 0) return false;
        const share = shares?.[shareId];
        return share && isShareManageable(share);
    });

    return sortItems('recent')(sharedByMe);
});

export const selectSharedByMeCount = createSelector(selectSharedByMe, (items) => items.length);

/** "Sort before search" strategy */
export const selectSharedByMeSearchResult = createSelector(
    [selectSharedByMe, (_: State, search?: string) => search],
    (sorted, search): ItemsSearchResults => {
        const searched = searchItems(sorted, search);
        return { searched, filtered: searched, totalCount: sorted.length };
    }
);
