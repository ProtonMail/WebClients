import type { Selector } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';

import { isTrashed } from '@proton/pass/lib/items/item.predicates';
import { isVaultShare } from '@proton/pass/lib/shares/share.predicates';
import { isOwnVault, isWritableVault } from '@proton/pass/lib/vaults/vault.predicates';
import type { VaultShare } from '@proton/pass/types';
import { type Maybe, type MaybeNull, type ShareType } from '@proton/pass/types';
import { PassFeature } from '@proton/pass/types/api/features';
import { and, invert } from '@proton/pass/utils/fp/predicates';
import { sortOn } from '@proton/pass/utils/fp/sort';

import { unwrapOptimisticState } from '../optimistic/utils/transformers';
import { type ShareItem } from '../reducers';
import type { State } from '../types';
import { SelectorError } from './errors';
import { selectItems } from './items';
import { selectProxiedSettings } from './settings';
import { selectFeatureFlag } from './user';

export const selectShares = ({ shares }: State) => shares;

export const selectAllShares = createSelector(selectShares, (shares) => Object.values(unwrapOptimisticState(shares)));

/* vaults returned from this selector are always
 * sorted alphabetically by ascending vault name  */
export const selectAllVaults = createSelector([selectAllShares], (shares) =>
    shares.filter(isVaultShare).sort((a, b) => a.content.name.localeCompare(b.content.name))
);

export const selectWritableVaults = createSelector([selectAllVaults], (vaults) => vaults.filter(isWritableVault));

export const selectOwnWritableVaults = createSelector([selectAllVaults], (vaults) =>
    vaults.filter(and(isWritableVault, isOwnVault))
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

/**
 * While the `PassRemovePrimaryVault` is disabled, we should still
 * resolve the primary vault when selecting the default vault. When
 * all clients are ready, we can safely drop this condition. The default
 * vault should be the oldest vault I own and can write to.
 */
export const selectDefaultVault = createSelector(
    [selectAllVaults, selectOwnWritableVaults, selectFeatureFlag(PassFeature.PassRemovePrimaryVault)],
    (vaults, ownWritableVaults, disablePrimaryVault) => {
        if (!disablePrimaryVault) {
            const primaryVault = vaults.find((vault) => vault.primary);
            if (primaryVault) return primaryVault;
        }

        return ownWritableVaults.filter((share) => share.owner).sort(sortOn('createTime', 'ASC'))[0];
    }
);

/* If autosave vault is not set, fallback to default vault */
export const selectAutosaveVault = createSelector(
    [selectShares, selectProxiedSettings, selectDefaultVault],
    (shares, settings, defaultVault): ShareItem<ShareType.Vault> => {
        const autosaveVaultId = settings.autosave.shareId;

        if (autosaveVaultId) {
            const share = shares[autosaveVaultId];
            if (share && isVaultShare(share)) return share;
        }

        return defaultVault;
    }
);

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
