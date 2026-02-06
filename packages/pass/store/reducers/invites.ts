import type { Reducer } from 'redux';

import { groupInviteAccept, groupInviteReject, inviteAccept, inviteReject, syncInvites } from '@proton/pass/store/actions';
import type { Invite } from '@proton/pass/types/data/invites';
import { or } from '@proton/pass/utils/fp/predicates';
import { objectDelete } from '@proton/pass/utils/object/delete';
import { objectFilter } from '@proton/pass/utils/object/filter';

export type InviteState = Record<string, Invite>;

const reducer: Reducer<InviteState> = (state = {}, action) => {
    if (syncInvites.match(action)) {
        return {
            ...objectFilter(state, (key, invite) => invite.type !== action.payload.type),
            ...action.payload.invites,
        };
    }

    if (
        or(inviteAccept.success.match, groupInviteAccept.success.match, inviteReject.success.match, groupInviteReject.success.match)(action)
    ) {
        return objectDelete(state, action.payload.inviteToken);
    }

    return state;
};

export default reducer;
