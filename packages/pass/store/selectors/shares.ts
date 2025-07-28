import { createSelector } from '@reduxjs/toolkit';

import { isItemShare, isShareVisible, isShareWritable, isVaultShare } from '@proton/pass/lib/shares/share.predicates';
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
import { prop } from '@proton/pass/utils/fp/lens';
import { not } from '@proton/pass/utils/fp/predicates';

import type { ShareItem } from '../reducers';
import type { State } from '../types';
import { SelectorError } from './errors';

export const selectShares = ({ shares }: State) => shares;
export const selectAllShares = createSelector(selectShares, (s) => Object.values(s));

export const selectVisibleShares = createSelector(
    selectAllShares,
    (shares) => new Set(shares.filter(isShareVisible).map(prop('shareId')))
);
export const selectItemShares = createSelector([selectAllShares], (s) => s.filter(isItemShare));
export const selectAllVaults = createSelector([selectAllShares], (s) => s.filter(isVaultShare).sort(sortVaults));
export const selectVisibleVaults = createSelector([selectAllVaults], (v) => v.filter(isShareVisible));
export const selectWritableShares = createSelector([selectAllShares], (v) => v.filter(isShareWritable));
export const selectWritableVaults = createSelector([selectAllVaults], (v) => v.filter(isWritableVault));
export const selectOwnedVaults = createSelector([selectAllVaults], (v) => v.filter(isOwnVault));
export const selectNonOwnedVaults = createSelector([selectAllVaults], (v) => v.filter(not(isOwnVault)));
export const selectOwnWritableVaults = createSelector([selectAllVaults], (v) => v.filter(isOwnWritableVault));
export const selectOwnReadOnlyVaults = createSelector([selectAllVaults], (v) => v.filter(isOwnReadonlyVault));
export const selectWritableSharedVaults = createSelector([selectAllVaults], (v) => v.filter(isWritableSharedVault));
export const selectCanCreateItems = createSelector([selectWritableVaults], (v) => v.length > 0);

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
