import type { Action, Reducer } from 'redux';

import { toShareAccessKey } from '@proton/pass/lib/access/access.utils';
import {
    getShareAccessOptions,
    inviteRemoveSuccess,
    newUserInvitePromoteSuccess,
    newUserInviteRemoveSuccess,
    shareEditMemberAccessSuccess,
    shareRemoveMemberAccessSuccess,
    vaultTransferOwnershipSuccess,
} from '@proton/pass/store/actions';
import type { NewUserPendingInvite, PendingInvite, ShareMember } from '@proton/pass/types/data/invites';
import { type Maybe } from '@proton/pass/types/utils';
import { partialMerge } from '@proton/pass/utils/object/merge';

export type AccessItem = {
    invites: PendingInvite[];
    newUserInvites: NewUserPendingInvite[];
    members: ShareMember[];
};

export type AccessState = { [shareKey: string]: Maybe<AccessItem> };

export const access: Reducer<AccessState> = (state = {}, action: Action) => {
    if (vaultTransferOwnershipSuccess.match(action)) {
        const shareKey = toShareAccessKey(action.payload);
        const { userShareId } = action.payload;

        const members = (state[shareKey]?.members ?? []).map((member) => {
            if (member.owner) return { ...member, owner: false };
            if (member.shareId === userShareId) return { ...member, owner: true };
            return member;
        });

        return partialMerge(state, { [shareKey]: { members } });
    }

    if (newUserInvitePromoteSuccess.match(action)) {
        const shareKey = toShareAccessKey(action.payload);
        const { invites, newUserInvites } = action.payload;
        return partialMerge(state, {
            [shareKey]: {
                invites,
                newUserInvites,
            },
        });
    }

    if (inviteRemoveSuccess.match(action)) {
        const shareKey = toShareAccessKey(action.payload);
        const { inviteId } = action.payload;
        const { invites = [] } = state[shareKey] ?? {};

        const update = invites.filter((invite) => invite.inviteId !== inviteId);

        return partialMerge(state, { [shareKey]: { invites: update } });
    }

    if (newUserInviteRemoveSuccess.match(action)) {
        const shareKey = toShareAccessKey(action.payload);
        const { newUserInviteId } = action.payload;
        const { newUserInvites = [] } = state[shareKey] ?? {};

        const update = newUserInvites.filter((invite) => invite.newUserInviteId !== newUserInviteId);

        return partialMerge(state, {
            [shareKey]: {
                newUserInvites: update,
            },
        });
    }

    if (getShareAccessOptions.success.match(action)) {
        const shareKey = toShareAccessKey(action.payload);
        const { invites = [], newUserInvites = [], members = [] } = action.payload;

        return partialMerge(state, {
            [shareKey]: {
                invites,
                members,
                newUserInvites,
            },
        });
    }

    if (shareEditMemberAccessSuccess.match(action)) {
        const shareKey = toShareAccessKey(action.payload);
        const { userShareId, shareRoleId } = action.payload;
        const members = state[shareKey]?.members ?? [];

        return partialMerge(state, {
            [shareKey]: {
                members: members.map<ShareMember>((member) =>
                    member.shareId === userShareId ? { ...member, shareRoleId } : member
                ),
            },
        });
    }

    if (shareRemoveMemberAccessSuccess.match(action)) {
        const shareKey = toShareAccessKey(action.payload);
        const { userShareId } = action.payload;
        return partialMerge(state, {
            [shareKey]: {
                members: (state[shareKey]?.members ?? []).filter(({ shareId }) => shareId !== userShareId),
            },
        });
    }

    return state;
};

export default access;
