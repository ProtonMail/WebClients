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
import type { ShareItem } from '@proton/pass/store/reducers';
import { selectRequestInFlight, selectRequestInFlightData } from '@proton/pass/store/request/selectors';
import type { State } from '@proton/pass/store/types';
import type { BulkSelectionDTO, Maybe, MaybeNull, ShareId, ShareType } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { not } from '@proton/pass/utils/fp/predicates';

import { SelectorError } from './errors';

export const selectShareState = ({ shares }: State) => shares;

export const selectAllShares = createSelector(selectShareState, (s) => Object.values(s));
export const selectAllVaults = createSelector([selectAllShares], (s) => s.filter(isVaultShare).sort(sortVaults));

export const selectVisibleShares = createSelector(selectAllShares, (shares) => shares.filter(isShareVisible));
export const selectVisibleShareIds = createSelector(selectVisibleShares, (shares) => new Set(shares.map(prop('shareId'))));
export const selectVisibleItemShares = createSelector([selectVisibleShares], (s) => s.filter(isItemShare));
export const selectVisibleVaults = createSelector([selectVisibleShares], (s) => s.filter(isVaultShare).sort(sortVaults));

export const selectWritableShares = createSelector([selectVisibleShares], (v) => v.filter(isShareWritable));
export const selectWritableVaults = createSelector([selectVisibleVaults], (v) => v.filter(isWritableVault));
export const selectOwnedVaults = createSelector([selectVisibleVaults], (v) => v.filter(isOwnVault));
export const selectNonOwnedVaults = createSelector([selectVisibleVaults], (v) => v.filter(not(isOwnVault)));
export const selectOwnWritableVaults = createSelector([selectVisibleVaults], (v) => v.filter(isOwnWritableVault));
export const selectOwnReadOnlyVaults = createSelector([selectVisibleVaults], (v) => v.filter(isOwnReadonlyVault));
export const selectWritableSharedVaults = createSelector([selectVisibleVaults], (v) => v.filter(isWritableSharedVault));
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

export const selectVaultsWithNewUserInvites = createSelector([selectOwnWritableVaults], (vaults) => vaults.filter(hasNewUserInvitesReady));

export const isShareLocked =
    (shareId: ShareId) =>
    (state: State): boolean => {
        const shareLocked = selectRequestInFlight(shareLockRequest(shareId))(state);
        if (shareLocked) return true;

        return [itemsBulkMoveRequest(), itemsBulkTrashRequest(), itemsBulkRestoreRequest(), itemsBulkDeleteRequest()].some((req) => {
            const dto = selectRequestInFlightData<BulkSelectionDTO>(req)(state);
            return dto && shareId in dto;
        });
    };
