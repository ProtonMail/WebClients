import { createSelector } from '@reduxjs/toolkit';

import type { Maybe, MaybeNull, Share, ShareType } from '@proton/pass/types';
import { invert } from '@proton/pass/utils/fp';
import { isVaultShare } from '@proton/pass/utils/pass/share';
import { isTrashed } from '@proton/pass/utils/pass/trash';

import { unwrapOptimisticState } from '../optimistic/utils/transformers';
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

export const selectAllVaultWithItemsCount = createSelector([selectAllVaults, selectItems], (shares, itemsByShareId) =>
    shares.map((share) => ({
        ...share,
        count: Object.values(itemsByShareId?.[share.shareId] ?? {}).filter(invert(isTrashed)).length,
    }))
);

export const selectPrimaryVault = createSelector([selectAllVaults], (vaults) => {
    const primaryVault = vaults.find((vault) => vault.primary);

    if (!primaryVault) {
        throw new SelectorError(`Primary vault not found`);
    }

    return primaryVault;
});

export const selectShare =
    <T extends ShareType = ShareType>(shareId?: MaybeNull<string>) =>
    ({ shares }: State) =>
        (shareId ? shares?.[shareId] : undefined) as Maybe<Share<T>>;

export const selectShareOrThrow =
    <T extends ShareType = ShareType>(shareId: string) =>
    (state: State): Share<T> => {
        const share = selectShare<T>(shareId)(state);

        if (!share) {
            throw new SelectorError(`Share ${shareId} not found`);
        }

        return share;
    };
