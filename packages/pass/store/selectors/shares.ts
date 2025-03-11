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
import {
    itemsBulkDeleteRequest,
    itemsBulkMoveRequest,
    itemsBulkRestoreRequest,
    itemsBulkTrashRequest,
    shareLockRequest,
} from '@proton/pass/store/actions/requests';
import { selectRequestInFlight, selectRequestInFlightData } from '@proton/pass/store/request/selectors';
import type { BulkSelectionDTO, Maybe, MaybeNull, ShareId, ShareType } from '@proton/pass/types';
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
export const selectOwnedVaults = createSelector([selectAllVaults], (v) => v.filter(isOwnVault));
export const selectNonOwnedVaults = createSelector([selectAllVaults], (v) => v.filter(not(isOwnVault)));
export const selectOwnWritableVaults = createSelector([selectAllVaults], (v) => v.filter(isOwnWritableVault));
export const selectOwnReadOnlyVaults = createSelector([selectAllVaults], (v) => v.filter(isOwnReadonlyVault));
export const selectWritableSharedVaults = createSelector([selectAllVaults], (v) => v.filter(isWritableSharedVault));
export const selectCanCreateItems = createSelector([selectWritableVaults], (v) => v.length > 0);

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
        return (
            items.filter((item) => shareIds.has(item.shareId)).sort(sortOn('createTime'))?.[0]?.shareId ??
            defaultVault?.shareId
        );
    }
);

export const selectVaultsWithNewUserInvites = createSelector([selectOwnWritableVaults], (vaults) =>
    vaults.filter(hasNewUserInvitesReady)
);

export const isShareLocked =
    (shareId: ShareId) =>
    (state: State): boolean => {
        const shareLocked = selectRequestInFlight(shareLockRequest(shareId))(state);
        if (shareLocked) return true;

        return [
            itemsBulkMoveRequest(),
            itemsBulkTrashRequest(),
            itemsBulkRestoreRequest(),
            itemsBulkDeleteRequest(),
        ].some((req) => {
            const dto = selectRequestInFlightData<BulkSelectionDTO>(req)(state);
            return dto && shareId in dto;
        });
    };
