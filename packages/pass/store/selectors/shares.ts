import type { Selector } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';

import { isActive } from '@proton/pass/lib/items/item.predicates';
import { isItemShare, isShareWritable, isVaultShare } from '@proton/pass/lib/shares/share.predicates';
import {
    hasNewUserInvitesReady,
    isOwnReadonlyVault,
    isOwnVault,
    isOwnWritableVault,
    isWritableSharedVault,
    isWritableVault,
} from '@proton/pass/lib/vaults/vault.predicates';
import { sortVaults } from '@proton/pass/lib/vaults/vault.utils';
import type { Maybe, MaybeNull, ShareType } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array/first';
import { prop } from '@proton/pass/utils/fp/lens';
import { not } from '@proton/pass/utils/fp/predicates';
import { sortOn } from '@proton/pass/utils/fp/sort';

import type { ShareItem, VaultShareItem } from '../reducers';
import type { State } from '../types';
import { SelectorError } from './errors';
import { selectAllItems, selectItems } from './items';

export const selectShares = ({ shares }: State) => shares;
export const selectAllShares = createSelector(selectShares, (s) => Object.values(s));
export const selectItemShares = createSelector([selectAllShares], (s) => s.filter(isItemShare));
export const selectAllVaults = createSelector([selectAllShares], (s) => s.filter(isVaultShare).sort(sortVaults));
export const selectWritableShares = createSelector([selectAllShares], (v) => v.filter(isShareWritable));
export const selectWritableVaults = createSelector([selectAllVaults], (v) => v.filter(isWritableVault));
export const selectNonOwnedVaults = createSelector([selectAllVaults], (v) => v.filter(not(isOwnVault)));
export const selectOwnWritableVaults = createSelector([selectAllVaults], (v) => v.filter(isOwnWritableVault));
export const selectOwnReadOnlyVaults = createSelector([selectAllVaults], (v) => v.filter(isOwnReadonlyVault));
export const selectWritableSharedVaults = createSelector([selectAllVaults], (v) => v.filter(isWritableSharedVault));

const createVaultsWithItemsCountSelector = (vaultSelector: Selector<State, VaultShareItem[]>) =>
    createSelector([vaultSelector, selectItems], (shares, itemsByShareId) =>
        shares.map((share) => ({
            ...share,
            count: Object.values(itemsByShareId?.[share.shareId] ?? {}).filter(isActive).length,
        }))
    );

export const selectVaultsWithItemsCount = createVaultsWithItemsCountSelector(selectAllVaults);
export const selectWritableVaultsWithItemsCount = createVaultsWithItemsCountSelector(selectWritableVaults);
export const selectWritableSharedVaultsWithItemsCount = createVaultsWithItemsCountSelector(selectWritableSharedVaults);

export const selectShare =
    <T extends ShareType = ShareType>(shareId?: MaybeNull<string>) =>
    ({ shares }: State) =>
        (shareId ? shares?.[shareId] : undefined) as Maybe<ShareItem<T>>;

export const selectIsWritableVault =
    (shareId: string) =>
    (state: State): boolean => {
        const share = selectShare(shareId)(state);
        return Boolean(share && isWritableVault(share));
    };

export const selectShareOrThrow =
    <T extends ShareType = ShareType>(shareId: string) =>
    (state: State): ShareItem<T> => {
        const share = selectShare<T>(shareId)(state);
        if (!share) throw new SelectorError(`Share ${shareId} not found`);

        return share;
    };

export const selectVaultItemsCount = (shareId: MaybeNull<string>) =>
    createSelector(
        selectShare<ShareType.Vault>(shareId),
        selectItems,
        (share, itemsByShareId): MaybeNull<number> =>
            share ? Object.values(itemsByShareId?.[share?.shareId] ?? {}).filter(isActive).length : null
    );

/* The default vault should be the oldest vault I own and can write to */
export const selectDefaultVault = createSelector(
    selectOwnWritableVaults,
    (ownWritableVaults): Maybe<VaultShareItem> => first(ownWritableVaults.sort(sortOn('createTime', 'ASC')))
);

/** Resolves the most recently used vault:
 * - Returns shareId of the latest item in user's writable vaults, sorted by creation time
 * - Falls back to user's default vault shareId if no writable items found */
export const selectMostRecentVaultShareID = createSelector(
    [selectOwnWritableVaults, selectAllItems, selectDefaultVault],
    (vaults, items, defaultVault): Maybe<string> => {
        const shareIds = new Set(vaults.map(prop('shareId')));
        return (
            items.filter((item) => shareIds.has(item.shareId)).sort(sortOn('createTime'))?.[0]?.shareId ??
            defaultVault?.shareId
        );
    }
);

export const selectVaultsWithNewUserInvites = createSelector([selectOwnWritableVaults], (vaults) =>
    vaults.filter(hasNewUserInvitesReady)
);
