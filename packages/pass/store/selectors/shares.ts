import type { Selector } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';

import { isActive } from '@proton/pass/lib/items/item.predicates';
import { isVaultShare } from '@proton/pass/lib/shares/share.predicates';
import { isOwnVault, isSharedVault, isWritableVault } from '@proton/pass/lib/vaults/vault.predicates';
import type { Maybe, MaybeNull, ShareType } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { and, not } from '@proton/pass/utils/fp/predicates';
import { sortOn } from '@proton/pass/utils/fp/sort';

import type { ShareItem, VaultShareItem } from '../reducers';
import type { State } from '../types';
import { SelectorError } from './errors';
import { selectAllItems, selectItems } from './items';

export const selectShares = ({ shares }: State) => shares;

export const selectAllShares = createSelector(selectShares, (shares) => Object.values(shares));

/* vaults returned from this selector are always
 * sorted alphabetically by ascending vault name  */
export const selectAllVaults = createSelector([selectAllShares], (shares) =>
    shares.filter(isVaultShare).sort((a, b) => a.content.name.localeCompare(b.content.name))
);

export const selectWritableVaults = createSelector([selectAllVaults], (vaults) => vaults.filter(isWritableVault));
export const selectNonOwnedVaults = createSelector([selectAllVaults], (vaults) => vaults.filter(not(isOwnVault)));
export const selectOwnWritableVaults = createSelector([selectAllVaults], (vaults) =>
    vaults.filter(and(isWritableVault, isOwnVault))
);
export const selectOwnReadOnlyVaults = createSelector([selectAllVaults], (vaults) =>
    vaults.filter(and(not(isWritableVault), isOwnVault))
);

export const selectWritableSharedVaults = createSelector([selectAllVaults], (vaults) =>
    vaults.filter(and(isWritableVault, isSharedVault))
);

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

/* The default vault should be the oldest vault I own and can write to */
export const selectDefaultVault = createSelector(
    selectOwnWritableVaults,
    (ownWritableVaults) => ownWritableVaults.filter((share) => share.owner).sort(sortOn('createTime', 'ASC'))[0]
);

export const selectShare =
    <T extends ShareType = ShareType>(shareId?: MaybeNull<string>) =>
    ({ shares }: State) =>
        (shareId ? shares?.[shareId] : undefined) as Maybe<ShareItem<T>>;

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

export const selectVaultSharedWithEmails = (shareId: string) =>
    createSelector(
        selectShare<ShareType.Vault>(shareId),
        (vault): Set<string> =>
            new Set(
                (vault?.members?.map(prop('email')) ?? [])
                    .concat(vault?.invites?.map(prop('invitedEmail')) ?? [])
                    .concat(vault?.newUserInvites?.map(prop('invitedEmail')) ?? [])
            )
    );

export const selectMostRecentVault = createSelector(
    [selectAllItems, selectDefaultVault],
    (items, defaultVault) => items.slice().sort(sortOn('createTime'))?.[0]?.shareId ?? defaultVault.shareId
);
