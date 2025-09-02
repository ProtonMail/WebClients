import { createSelector } from '@reduxjs/toolkit';

import { isActive } from '@proton/pass/lib/items/item.predicates';
import { sortItems } from '@proton/pass/lib/items/item.utils';
import { isShareManageable } from '@proton/pass/lib/shares/share.predicates';
import type { ItemRevision, Share } from '@proton/pass/types';
import type { SelectedItem } from '@proton/pass/types';

import { itemsFromSelection, selectAllItems, selectItem, selectItems, selectTrashedItems } from './items';
import { selectItemShares, selectShare, selectShares } from './shares';

export const isItemShared = (item?: ItemRevision, share?: Share): boolean =>
    Boolean((item?.shareCount ?? 0) > 0 || share?.shared);

export const selectItemShared = (shareId: string, itemId: string) =>
    createSelector([selectItem(shareId, itemId), selectShare(shareId)], isItemShared);

export const selectSharedWithMe = createSelector([selectItemShares, selectItems], (itemShares, items) => {
    const selection: SelectedItem[] = itemShares.map(({ shareId, targetId: itemId }) => ({ shareId, itemId }));
    const sharedWithMe = itemsFromSelection(selection)(items);
    return sortItems('recent')(sharedWithMe);
});

export const selectSharedByMe = createSelector([selectAllItems, selectShares], (items, shares) => {
    const sharedByMe = items.filter(({ shareId, shareCount = 0 }) => {
        if (shareCount <= 0) return false;
        const share = shares?.[shareId];
        return share && isShareManageable(share);
    });

    return sortItems('recent')(sharedByMe);
});

export const selectHasTrashedSharedItems = createSelector(
    [selectTrashedItems, selectShares],
    (items, shares) => items.filter((item) => isItemShared(item, shares?.[item.shareId])).length > 0
);

export const selectSharedByMeCount = createSelector(selectSharedByMe, (items) => items.length);
export const selectSharedWithMeCount = createSelector(selectSharedWithMe, (items) => items.length);
export const selectActiveSharedWithMeCount = createSelector(
    selectSharedWithMe,
    (items) => items.filter(isActive).length
);
