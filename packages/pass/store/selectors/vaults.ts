import type { Selector } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';

import { isActive } from '../../lib/items/item.predicates';
import type { Maybe, MaybeNull, ShareType } from '../../types';
import { first } from '../../utils/array/first';
import { prop } from '../../utils/fp/lens';
import { sortOn } from '../../utils/fp/sort';
import type { VaultShareItem } from '../reducers';
import type { State } from '../types';
import { selectAllItems, selectItems } from './items';
import { selectOwnWritableVaults, selectShare, selectVisibleVaults, selectWritableSharedVaults, selectWritableVaults } from './shares';

const createVaultsWithItemsCountSelector = (vaultSelector: Selector<State, VaultShareItem[]>) =>
    createSelector([vaultSelector, selectItems], (shares, itemsByShareId) =>
        shares.map((share) => ({
            ...share,
            count: Object.values(itemsByShareId?.[share.shareId] ?? {}).filter(isActive).length,
        }))
    );

export const selectVisibleVaultsWithCount = createVaultsWithItemsCountSelector(selectVisibleVaults);
export const selectWritableVaultsWithCount = createVaultsWithItemsCountSelector(selectWritableVaults);
export const selectWritableSharedVaultsWithCount = createVaultsWithItemsCountSelector(selectWritableSharedVaults);

export const selectVaultItemsCount = (shareId: MaybeNull<string>) =>
    createSelector(selectShare<ShareType.Vault>(shareId), selectItems, (share, itemsByShareId): MaybeNull<number> =>
        share ? Object.values(itemsByShareId?.[share?.shareId] ?? {}).filter(isActive).length : null
    );

/** The default vault should be the oldest vault I own and can write to.
 * If no own writable vault exists (due to organization policy disabling vault creation),
 * then return the oldest writable vault */
export const selectDefaultVault = createSelector(
    [selectOwnWritableVaults, selectWritableVaults],
    (ownWritableVaults, writableVaults): Maybe<VaultShareItem> => {
        const vaults = ownWritableVaults.length > 0 ? ownWritableVaults : writableVaults;
        return first(vaults.sort(sortOn('createTime', 'ASC')));
    }
);

/** Resolves the most recently used vault:
 * - Returns shareId of the latest item in user's writable vaults, sorted by creation time
 * - Falls back to user's default vault shareId if no writable items found */
export const selectMostRecentVaultShareID = createSelector(
    [selectOwnWritableVaults, selectWritableVaults, selectAllItems, selectDefaultVault],
    (ownWritableVaults, writableVaults, items, defaultVault): Maybe<string> => {
        /** Only *own* writable vaults should be considered,
         * unless there are none (due to organization policy disabling vault creation),
         * in which case non-owned writable vaults can also be considered */
        const vaults = ownWritableVaults.length > 0 ? ownWritableVaults : writableVaults;
        const shareIds = new Set(vaults.map(prop('shareId')));
        return items.filter((item) => shareIds.has(item.shareId)).sort(sortOn('createTime'))?.[0]?.shareId ?? defaultVault?.shareId;
    }
);
