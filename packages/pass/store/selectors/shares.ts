import { createSelector } from '@reduxjs/toolkit';

import type { Maybe, MaybeNull, Share, ShareType, VaultShare } from '@proton/pass/types';
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

export const selectAllVaults = createSelector([selectAllShares], (shares) => shares.filter(isVaultShare));
export const selectAllVaultWithItemsCount = createSelector([selectAllVaults, selectItems], (shares, itemsByShareId) =>
    shares.map((share) => ({
        ...share,
        count: Object.values(itemsByShareId?.[share.shareId] ?? {}).filter(invert(isTrashed)).length,
    }))
);

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

export const selectDefaultVault = (state: State): Maybe<VaultShare> =>
    Object.values(selectAllShares(state).filter(isVaultShare))[0];

export const selectDefaultVaultOrThrow = (state: State): VaultShare => {
    const defaultVault = selectDefaultVault(state);

    if (!defaultVault) {
        throw new SelectorError(`Default vault not found`);
    }

    return defaultVault;
};
