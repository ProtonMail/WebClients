import type { Action, Reducer } from 'redux';

import {
    bootSuccess,
    getShareAccessOptions,
    inviteAcceptSuccess,
    inviteBatchCreateSuccess,
    newUserInvitePromoteSuccess,
    shareAccessChange,
    shareDeleteSync,
    shareEditSync,
    shareEvent,
    shareLeaveSuccess,
    sharedVaultCreated,
    sharesSync,
    syncSuccess,
    vaultCreationSuccess,
    vaultDeleteSuccess,
    vaultEditSuccess,
    vaultTransferOwnershipSuccess,
} from '@proton/pass/store/actions';
import type { Share, ShareId } from '@proton/pass/types';
import { NewUserInviteState, ShareRole, type ShareType } from '@proton/pass/types';
import { or } from '@proton/pass/utils/fp/predicates';
import { objectDelete } from '@proton/pass/utils/object/delete';
import { fullMerge, partialMerge } from '@proton/pass/utils/object/merge';

export type ShareItem<T extends ShareType = ShareType> = Share<T>;

export type WithItemCount<T> = T & { count: number };
export type VaultShareItem = ShareItem<ShareType.Vault>;
export type SharesState = Record<ShareId, ShareItem>;

export const shares: Reducer<SharesState> = (state = {}, action: Action) => {
    if (bootSuccess.match(action) && action.payload?.shares !== undefined) return action.payload.shares;
    if (syncSuccess.match(action)) return action.payload.shares;
    if (sharesSync.match(action)) return fullMerge(state, action.payload.shares);

    if (shareEvent.match(action) && state !== null) {
        const { shareId, Events } = action.payload;
        const currentEventId = state[shareId].eventId;

        return Events.LatestEventID === currentEventId
            ? state
            : partialMerge(state, {
                  [action.payload.shareId]: { eventId: action.payload.Events.LatestEventID },
              });
    }

    if (vaultCreationSuccess.match(action)) {
        const { share } = action.payload;
        return fullMerge(state, { [share.shareId]: share });
    }

    if (vaultEditSuccess.match(action)) {
        const { share } = action.payload;
        return partialMerge(state, { [share.shareId]: share });
    }

    if (shareEditSync.match(action)) {
        const { id, share } = action.payload;
        return fullMerge(state, { [id]: share });
    }

    if (or(vaultDeleteSuccess.match, shareDeleteSync.match, shareLeaveSuccess.match)(action)) {
        return objectDelete(state, action.payload.shareId);
    }

    if (vaultTransferOwnershipSuccess.match(action)) {
        const { shareId } = action.payload;
        return partialMerge(state, { [shareId]: { owner: false, shareRoleId: ShareRole.ADMIN } });
    }

    if (sharedVaultCreated.match(action)) {
        const { share } = action.payload;
        return partialMerge(state, { [share.shareId]: share });
    }

    if (inviteBatchCreateSuccess.match(action) && !action.payload.itemId)
        {partialMerge(state, { [action.payload.shareId]: { shared: true } });}

    if (newUserInvitePromoteSuccess.match(action)) {
        const { shareId } = action.payload;
        const { newUserInvitesReady } = state[shareId];
        return partialMerge(state, {
            [shareId]: {
                newUserInvitesReady: Math.max(newUserInvitesReady - 1, 0),
            },
        });
    }

    if (shareAccessChange.match(action)) {
        const { shareId, ...shareAccessOptions } = action.payload;
        return partialMerge(state, { [shareId]: shareAccessOptions });
    }

    if (getShareAccessOptions.success.match(action) && !action.payload.itemId) {
        const { shareId, invites = [], newUserInvites = [], members } = action.payload;
        const shared = invites.length > 0 || newUserInvites.length > 0 || members.length > 1;
        const newUserInvitesReady = newUserInvites.filter((invite) => invite.state === NewUserInviteState.READY).length;

        return partialMerge(state, {
            [shareId]: {
                newUserInvitesReady,
                shared,
            },
        });
    }

    if (inviteAcceptSuccess.match(action)) {
        return partialMerge(state, { [action.payload.share.shareId]: action.payload.share });
    }

    return state;
};

export default shares;
