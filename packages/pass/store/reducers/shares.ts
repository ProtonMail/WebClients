import type { Action, Reducer } from 'redux';

import {
    bootSuccess,
    getShareAccessOptions,
    inviteAcceptSuccess,
    inviteBatchCreateSuccess,
    inviteRemoveSuccess,
    newUserInvitePromoteSuccess,
    newUserInviteRemoveSuccess,
    shareAccessChange,
    shareDeleteSync,
    shareEditMemberAccessSuccess,
    shareEditSync,
    shareEvent,
    shareLeaveSuccess,
    shareRemoveMemberAccessSuccess,
    sharedVaultCreated,
    sharesSync,
    syncSuccess,
    vaultCreationSuccess,
    vaultDeleteSuccess,
    vaultEditSuccess,
    vaultTransferOwnershipSuccess,
} from '@proton/pass/store/actions';
import type { Share } from '@proton/pass/types';
import { ShareRole, type ShareType } from '@proton/pass/types';
import type { NewUserPendingInvite, PendingInvite, ShareMember } from '@proton/pass/types/data/invites';
import { or } from '@proton/pass/utils/fp/predicates';
import { objectDelete } from '@proton/pass/utils/object/delete';
import { fullMerge, partialMerge } from '@proton/pass/utils/object/merge';

export type ShareItem<T extends ShareType = ShareType> = Share<T> & {
    invites?: PendingInvite[];
    newUserInvites?: NewUserPendingInvite[];
    members?: ShareMember[];
};

export type WithItemCount<T> = T & { count: number };
export type VaultShareItem = ShareItem<ShareType.Vault>;

export type SharesState = { [shareId: string]: ShareItem };

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
        const { shareId, userShareId } = action.payload;
        const members = (state[shareId].members ?? []).map((member) => {
            if (member.owner) return { ...member, owner: false };
            if (member.shareId === userShareId) return { ...member, owner: true };
            return member;
        });

        return partialMerge(state, { [shareId]: { owner: false, shareRoleId: ShareRole.ADMIN, members } });
    }

    if (sharedVaultCreated.match(action)) {
        const { share } = action.payload;
        return partialMerge(state, { [share.shareId]: share });
    }

    if (inviteBatchCreateSuccess.match(action)) partialMerge(state, { [action.payload.shareId]: { shared: true } });

    if (newUserInvitePromoteSuccess.match(action)) {
        const { shareId, invites, newUserInvites } = action.payload;
        return partialMerge(state, { [shareId]: { newUserInvites, invites } });
    }

    if (inviteRemoveSuccess.match(action)) {
        const { shareId, inviteId } = action.payload;
        const { members = [], invites = [], newUserInvites = [] } = state[shareId];

        const update = invites.filter((invite) => invite.inviteId !== inviteId);
        const shared = members.length > 1 || update.length > 0 || newUserInvites.length > 0;

        return partialMerge(state, { [shareId]: { invites: update, shared } });
    }

    if (newUserInviteRemoveSuccess.match(action)) {
        const { shareId, newUserInviteId } = action.payload;
        const { members = [], invites = [], newUserInvites = [] } = state[shareId];

        const update = newUserInvites.filter((invite) => invite.newUserInviteId !== newUserInviteId);
        const shared = members.length > 1 || invites.length > 0 || update.length > 0;

        return partialMerge(state, { [shareId]: { newUserInvites: update, shared } });
    }

    if (shareAccessChange.match(action)) {
        const { shareId, ...shareAccessOptions } = action.payload;
        return partialMerge(state, { [shareId]: shareAccessOptions });
    }

    if (getShareAccessOptions.success.match(action)) {
        const { shareId, invites, newUserInvites, members } = action.payload;
        const shared = (invites?.length ?? 0) > 0 || (newUserInvites?.length ?? 0) > 0 || members.length > 1;
        return partialMerge(state, { [shareId]: { invites, members, newUserInvites, shared } });
    }

    if (shareEditMemberAccessSuccess.match(action)) {
        const { shareId, userShareId, shareRoleId } = action.payload;
        const members = state[shareId].members ?? [];

        return partialMerge(state, {
            [shareId]: {
                members: members.map<ShareMember>((member) =>
                    member.shareId === userShareId ? { ...member, shareRoleId } : member
                ),
            },
        });
    }

    if (shareRemoveMemberAccessSuccess.match(action)) {
        const { shareId, userShareId } = action.payload;
        return partialMerge(state, {
            [shareId]: {
                members: (state[shareId]?.members ?? []).filter(({ shareId }) => shareId !== userShareId),
            },
        });
    }

    if (inviteAcceptSuccess.match(action)) {
        return partialMerge(state, { [action.payload.share.shareId]: action.payload.share });
    }

    return state;
};

export default shares;
