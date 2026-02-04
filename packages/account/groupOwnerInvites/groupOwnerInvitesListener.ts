import type { SharedStartListening } from '@proton/redux-shared-store-types';

import type { GroupOwnerInvitesState } from '.';
import { groupOwnerInvitesThunk, selectGroupOwnerInvites } from '.';
import type { GroupMembershipsState } from '../groupMemberships';
import { groupMembershipsThunk } from '../groupMemberships';
import { groupThunk } from '../groups';
import { acceptGroupOwnerInviteThunk } from '../groups/acceptGroupOwnerInvite';
import type { GroupsState } from '../groups/index';

type CombinedState = GroupOwnerInvitesState & GroupsState & GroupMembershipsState;

export const groupOwnerInvitesListener = (startListening: SharedStartListening<CombinedState>) => {
    startListening({
        predicate: (_action, currentState, previousState) => {
            return selectGroupOwnerInvites(currentState)?.value !== selectGroupOwnerInvites(previousState)?.value;
        },
        effect: async (_action, listenerApi) => {
            const invitesMap = await listenerApi.dispatch(groupOwnerInvitesThunk());
            const invites = Object.values(invitesMap);

            if (!invites.length) {
                return; // no invites to accept
            }

            // Accept each invite in sequence to never overload the client
            for (const invite of invites) {
                await listenerApi.dispatch(acceptGroupOwnerInviteThunk({ invite }));
            }

            // refetch groups and memberships
            await listenerApi.dispatch(groupThunk());
            await listenerApi.dispatch(groupMembershipsThunk());
        },
    });
};
