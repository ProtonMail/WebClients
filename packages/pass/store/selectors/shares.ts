import { createSelector } from '@reduxjs/toolkit';

import { isItemShare, isShareDeduped, isShareWritable, isVaultShare } from '@proton/pass/lib/shares/share.predicates';
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
import { not } from '@proton/pass/utils/fp/predicates';
import { logId } from '@proton/pass/utils/logger';

import { SelectorError } from './errors';

export const selectShareState = ({ shares }: State) => shares;
export const selectShareDedupeState = ({ sharesDedupe: { dedupe } }: State) => dedupe;
export const selectShareDedupeAndVisibileState = ({ sharesDedupe: { dedupeAndVisible } }: State) => dedupeAndVisible;

export const selectAllShares = createSelector([selectShareState], (s) => Object.values(s));
export const selectAllVaults = createSelector([selectAllShares], (s) => s.filter(isVaultShare).sort(sortVaults));

export const selectDedupedShares = createSelector([selectAllShares, selectShareDedupeState], (s, d) => s.filter(isShareDeduped(d)));
export const selectDedupedVaults = createSelector([selectAllVaults, selectShareDedupeState], (s, d) => s.filter(isShareDeduped(d)));

export const selectVisibleVaults = createSelector([selectAllVaults, selectShareDedupeAndVisibileState], (s, d) =>
    s.filter(isShareDeduped(d))
);
export const selectVisibleShares = createSelector([selectAllShares, selectShareDedupeAndVisibileState], (s, d) =>
    s.filter(isShareDeduped(d))
);

/** Creates a selector that filters items by share visibility.
 * Takes any selector returning "entries" with `shareId` and
 * filters them to only include visible shareId references. */
export const createVisibilityFilterSelector = <T extends { shareId: string }>(filterableSelector: (state: State) => T[]) =>
    createSelector([filterableSelector, selectShareDedupeAndVisibileState], (entries, shareIds) => {
        return entries.filter(({ shareId }) => shareIds.includes(shareId));
    });

export const selectItemShares = createSelector([selectDedupedShares], (s) => s.filter(isItemShare));
export const selectWritableShares = createSelector([selectDedupedShares], (v) => v.filter(isShareWritable));
export const selectVisibleWritableShares = createSelector([selectVisibleShares], (v) => v.filter(isShareWritable));
export const selectWritableVaults = createSelector([selectDedupedShares], (v) => v.filter(isWritableVault));
export const selectOwnedVaults = createSelector([selectDedupedVaults], (v) => v.filter(isOwnVault));
export const selectNonOwnedVaults = createSelector([selectDedupedVaults], (v) => v.filter(not(isOwnVault)));
export const selectOwnWritableVaults = createSelector([selectDedupedVaults], (v) => v.filter(isOwnWritableVault));
export const selectOwnReadOnlyVaults = createSelector([selectDedupedVaults], (v) => v.filter(isOwnReadonlyVault));
export const selectWritableSharedVaults = createSelector([selectDedupedShares], (v) => v.filter(isWritableSharedVault));

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
        if (!share) throw new SelectorError(`Share ${logId(shareId)} not found`);

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
