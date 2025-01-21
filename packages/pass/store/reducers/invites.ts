import type { Reducer } from 'redux';

import { inviteAccept, inviteReject, syncInvites } from '@proton/pass/store/actions';
import type { Invite } from '@proton/pass/types/data/invites';
import { or } from '@proton/pass/utils/fp/predicates';
import { objectDelete } from '@proton/pass/utils/object/delete';

export type InviteState = Record<string, Invite>;

const reducer: Reducer<InviteState> = (state = {}, action) => {
    if (syncInvites.match(action)) return action.payload;

    if (or(inviteAccept.success.match, inviteReject.success.match)(action)) {
        return objectDelete(state, action.payload.inviteToken);
    }

    return state;
};

export default reducer;
