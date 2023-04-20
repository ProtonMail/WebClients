import { Reducer } from 'redux';

import { EventActions, MaybeNull } from '@proton/pass/types';
import type { UserTier } from '@proton/pass/types/data/telemetry';
import { fullMerge, merge, objectDelete, partialMerge } from '@proton/pass/utils/object';
import type { Address, User } from '@proton/shared/lib/interfaces';

import { bootSuccess, serverEvent } from '../actions';

export type AddressState = { [addressId: string]: Address };

export type UserState = {
    eventId: MaybeNull<string>;
    user: MaybeNull<User>;
    tier: MaybeNull<UserTier>;
    addresses: AddressState;
};

const reducer: Reducer<UserState> = (state = { user: null, tier: null, addresses: {}, eventId: null }, action) => {
    if (bootSuccess.match(action)) {
        return fullMerge(state, {
            user: action.payload.user,
            tier: action.payload.tier,
            addresses: action.payload.addresses,
            eventId: action.payload.eventId,
        });
    }

    if (serverEvent.match(action) && action.payload.event.type === 'user') {
        const { Addresses = [], User, EventID } = action.payload.event;

        return {
            ...(User ? partialMerge(state, { user: User }) : state),
            eventId: EventID ?? null,
            addresses: Addresses.reduce(
                (acc, { Action, ID, Address }) =>
                    Action === EventActions.DELETE ? objectDelete(acc, ID) : merge(acc, { [ID]: Address }),
                state.addresses
            ),
        };
    }

    return state;
};

export default reducer;
