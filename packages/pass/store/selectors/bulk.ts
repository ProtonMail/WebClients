import { createSelector } from '@reduxjs/toolkit';

import { isAliasItem } from '@proton/pass/lib/items/item.predicates';
import { selectItems, selectItemsState } from '@proton/pass/store/selectors/items';
import { selectSecureLinks } from '@proton/pass/store/selectors/secure-links';
import { isItemShared } from '@proton/pass/store/selectors/shared';
import { selectShareState } from '@proton/pass/store/selectors/shares';
import type { BulkSelectionDTO } from '@proton/pass/types';

export const selectBulkSelection = (dto: BulkSelectionDTO) =>
    createSelector(selectItemsState, (items) =>
        Object.entries(dto).flatMap(([shareId, itemIds]) => Object.keys(itemIds).map((itemId) => items[shareId][itemId]))
    );

export const selectBulkSelectionAliasCount = (dto: BulkSelectionDTO) =>
    createSelector(selectItemsState, (items): number =>
        Object.entries(dto).reduce<number>((aliasCount, [shareId, itemIds]) => {
            return (
                aliasCount +
                Object.keys(itemIds).reduce<number>((shareAliasCount, itemId) => {
                    const item = items?.[shareId]?.[itemId];
                    return item && isAliasItem(item.data) ? shareAliasCount + 1 : shareAliasCount;
                }, 0)
            );
        }, 0)
    );

export const selectBulkHasSecureLinks = (dto: BulkSelectionDTO) =>
    createSelector(selectSecureLinks, (secureLinks): boolean =>
        Object.entries(dto).some(([shareId, items]) => Object.keys(items).some((itemId) => Boolean(secureLinks[shareId]?.[itemId])))
    );

export const selectBulkHasSharedItems = (dto: BulkSelectionDTO) =>
    createSelector([selectItems, selectShareState], (items, shares): boolean =>
        Object.entries(dto).some(([shareId, selected]) =>
            Object.keys(selected).some((itemId) => {
                const item = items?.[shareId]?.[itemId];
                const share = shares?.[shareId];
                return item ? isItemShared(item, share) : false;
            })
        )
    );
