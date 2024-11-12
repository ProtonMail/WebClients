import type { Selector } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';

import { isActive } from '@proton/pass/lib/items/item.predicates';
import { isVaultShare } from '@proton/pass/lib/shares/share.predicates';
import {
    hasNewUserInvitesReady,
    isOwnVault,
    isSharedVault,
    isWritableVault,
} from '@proton/pass/lib/vaults/vault.predicates';
import type { Maybe, MaybeNull, ShareType } from '@proton/pass/types';
import { first } from '@proton/pass/utils/array/first';
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
