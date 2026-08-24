import type { Reducer } from 'redux';

import { toMap } from '@proton/shared/lib/helpers/object';

import type { Invite } from '../../types/data/invites';
import { or } from '../../utils/fp/predicates';
import { objectDelete } from '../../utils/object/delete';
import { objectFilter } from '../../utils/object/filter';
import { groupInviteAccept, groupInviteReject, inviteAccept, inviteReject, matchSyncAction, syncInvites } from '../actions';

export type InviteState = Record<string, Invite>;

const reducer: Reducer<InviteState> = (state = {}, action) => {
    if (matchSyncAction(action) && action.payload?.v === 2) return toMap(action.payload.invites, 'token');

    if (syncInvites.match(action)) {
        return {
            ...objectFilter(state, (_, invite) => invite.type !== action.payload.type),
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
