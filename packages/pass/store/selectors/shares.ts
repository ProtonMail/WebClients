import type { Selector } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';

import type { VaultShare } from '@proton/pass/types';
import { type Maybe, type MaybeNull, ShareRole, type ShareType } from '@proton/pass/types';
import { invert } from '@proton/pass/utils/fp';
import { isVaultShare } from '@proton/pass/utils/pass/share';
import { isTrashed } from '@proton/pass/utils/pass/trash';

import { unwrapOptimisticState } from '../optimistic/utils/transformers';
import { type ShareItem } from '../reducers';
import type { State } from '../types';
import { SelectorError } from './errors';
import { selectItems } from './items';

export const selectAllShares = createSelector(
    ({ shares }: State) => shares,
    (shares) => Object.values(unwrapOptimisticState(shares))
);

/* vaults returned from this selector are always
 * sorted alphabetically by ascending vault name  */
export const selectAllVaults = createSelector([selectAllShares], (shares) =>
    shares.filter(isVaultShare).sort((a, b) => a.content.name.localeCompare(b.content.name))
);

export const selectWritableVaults = createSelector([selectAllVaults], (vaults) =>
    vaults.filter((share) => share.shareRoleId !== ShareRole.READ)
);

const createVaultsWithItemsCountSelector = (vaultSelector: Selector<State, VaultShare[]>) =>
    createSelector([vaultSelector, selectItems], (shares, itemsByShareId) =>
        shares.map((share) => ({
            ...share,
            count: Object.values(itemsByShareId?.[share.shareId] ?? {}).filter(invert(isTrashed)).length,
        }))
    );

export const selectVaultsWithItemsCount = createVaultsWithItemsCountSelector(selectAllVaults);
export const selectWritableVaultsWithItemsCount = createVaultsWithItemsCountSelector(selectWritableVaults);

export const selectPrimaryVault = createSelector([selectAllVaults], (vaults) => {
    const primaryVault = vaults.find((vault) => vault.primary);
    if (!primaryVault) throw new SelectorError(`Primary vault not found`);

    return primaryVault;
});

export const selectShare =
    <T extends ShareType = ShareType>(shareId?: MaybeNull<string>) =>
    ({ shares }: State) =>
        (shareId ? shares?.[shareId] : undefined) as Maybe<ShareItem<T>>;

export const selectShareOrThrow =
    <T extends ShareType = ShareType>(shareId: string) =>
    (state: State): ShareItem<T> => {
        const share = selectShare<T>(shareId)(state);

        if (!share) {
            throw new SelectorError(`Share ${shareId} not found`);
        }

        return share;
    };

export const selectVaultWithItemsCount = (shareId: string) =>
    createSelector(
        selectShareOrThrow<ShareType.Vault>(shareId),
        selectItems,
        (share, itemsByShareId): ShareItem<ShareType.Vault> & { count: number } => ({
            ...share,
            count: Object.values(itemsByShareId?.[share?.shareId] ?? {}).filter(invert(isTrashed)).length,
        })
    );
