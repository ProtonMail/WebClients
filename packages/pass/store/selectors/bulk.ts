import { createSelector } from '@reduxjs/toolkit';

import { isAliasItem } from '../../lib/items/item.predicates';
import type { BulkSelectionDTO } from '../../types';
import { selectItems, selectItemsState } from './items';
import { selectSecureLinksState } from './secure-links';
import { isItemShared } from './shared';
import { selectShareState } from './shares';

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
    createSelector(selectSecureLinksState, (secureLinks): boolean =>
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
