import type { Action, Reducer } from 'redux';

import { toShareAccessKey } from '../../lib/access/access.utils';
import type { AccessItem } from '../../lib/access/types';
import type { Maybe } from '../../types/utils';
import { partialMerge } from '../../utils/object/merge';
import {
    getShareAccessOptions,
    inviteRemoveSuccess,
    newUserInvitePromoteSuccess,
    newUserInviteRemoveSuccess,
    shareEditMemberAccessSuccess,
    shareRemoveMemberAccessSuccess,
    vaultTransferOwnershipSuccess,
} from '../actions';

export type AccessState = { [accessKey: string]: Maybe<AccessItem> };

const updateAccess = (state: AccessState) => (accessKey: string, update: Partial<AccessItem>) => {
    const access = state[accessKey];
    if (!access) return state;

    return partialMerge(state, { [accessKey]: update });
};

export const access: Reducer<AccessState> = (state = {}, action: Action) => {
    if (getShareAccessOptions.success.match(action)) return partialMerge(state, action.payload);

    if (vaultTransferOwnershipSuccess.match(action)) {
        const { userShareId } = action.payload;
        const accessKey = toShareAccessKey(action.payload);

        return updateAccess(state)(accessKey, {
            members: (state[accessKey]?.members ?? []).map((member) => {
                if (member.owner) return { ...member, owner: false };
                if (member.shareId === userShareId) return { ...member, owner: true };
                return member;
            }),
        });
    }

    if (newUserInvitePromoteSuccess.match(action)) {
        const { invites, newUserInvites } = action.payload;
        const accessKey = toShareAccessKey(action.payload);

        return updateAccess(state)(accessKey, { invites, newUserInvites });
    }

    if (inviteRemoveSuccess.match(action)) {
        const { inviteId } = action.payload;
        const accessKey = toShareAccessKey(action.payload);

        return updateAccess(state)(accessKey, {
            invites: (state[accessKey]?.invites ?? []).filter((invite) => invite.inviteId !== inviteId),
        });
    }

    if (newUserInviteRemoveSuccess.match(action)) {
        const { newUserInviteId } = action.payload;
        const accessKey = toShareAccessKey(action.payload);

        return updateAccess(state)(accessKey, {
            newUserInvites: (state[accessKey]?.newUserInvites ?? []).filter((invite) => invite.newUserInviteId !== newUserInviteId),
        });
    }

    if (shareEditMemberAccessSuccess.match(action)) {
        const { userShareId, shareRoleId } = action.payload;
        const accessKey = toShareAccessKey(action.payload);

        return updateAccess(state)(accessKey, {
            members: (state[accessKey]?.members ?? []).map((member) =>
                member.shareId === userShareId ? { ...member, shareRoleId } : member
            ),
        });
    }

    if (shareRemoveMemberAccessSuccess.match(action)) {
        const { userShareId } = action.payload;
        const accessKey = toShareAccessKey(action.payload);

        return updateAccess(state)(accessKey, {
            members: (state[accessKey]?.members ?? []).filter(({ shareId }) => shareId !== userShareId),
        });
    }

    return state;
};

export default access;
