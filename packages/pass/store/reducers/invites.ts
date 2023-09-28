import type { Reducer } from 'redux';

import type { Invite } from '@proton/pass/types/data/invites';

import { syncInvites } from '../actions';

export type InviteState = Record<string, Invite>;

const reducer: Reducer<InviteState> = (state = {}, action) => {
    if (syncInvites.match(action)) return action.payload;
    return state;
};

export default reducer;
