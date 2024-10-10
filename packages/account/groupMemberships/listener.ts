import type { SharedStartListening } from '@proton/redux-shared-store/listenerInterface';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';

import { type AddressesState, selectAddresses } from '../addresses';
import { serverEvent } from '../eventLoop';
import { type GroupMembershipsState, updateGroupMemberships } from '../groupMemberships';

interface RequiredState extends AddressesState, GroupMembershipsState {}

export const groupMembershipsListener = (startListening: SharedStartListening<RequiredState>) => {
    startListening({
        actionCreator: serverEvent,
        effect: async (action, listenerApi) => {
            const groupMembers = action.payload.GroupMembers;
            if (!groupMembers) {
                return;
            }

            const state = listenerApi.getState();
            const addresses = selectAddresses(state).value;
            if (!addresses) {
                return;
            }

            const ownAddressIDs = new Set(addresses.map((address) => address.ID));

            const groupMemberships = groupMembers.filter((groupMember) => {
                if (groupMember.Action === EVENT_ACTIONS.DELETE) {
                    return true; // always pass along delete events
                }
                const addressID = groupMember.GroupMember.AddressID ?? groupMember.GroupMember.AddressId;
                if (addressID === undefined) {
                    return false;
                }
                return ownAddressIDs.has(addressID);
            });

            listenerApi.dispatch(
                updateGroupMemberships({
                    GroupMemberships: groupMemberships,
                })
            );
        },
    });
};
