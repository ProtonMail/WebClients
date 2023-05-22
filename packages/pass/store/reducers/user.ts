import type { Reducer } from 'redux';

import type { MaybeNull, PassPlanResponse } from '@proton/pass/types';
import { EventActions } from '@proton/pass/types';
import { fullMerge, merge, objectDelete, partialMerge } from '@proton/pass/utils/object';
import type { Address, User } from '@proton/shared/lib/interfaces';

import { bootSuccess, serverEvent, setUserPlan } from '../actions';

export type AddressState = { [addressId: string]: Address };

export type UserState = {
    eventId: MaybeNull<string>;
    user: MaybeNull<User>;
    addresses: AddressState;
    plan: MaybeNull<PassPlanResponse>;
};

const reducer: Reducer<UserState> = (state = { user: null, addresses: {}, eventId: null, plan: null }, action) => {
    if (setUserPlan.match(action)) {
        return partialMerge(state, {
            plan: action.payload,
        });
    }

    if (bootSuccess.match(action)) {
        return fullMerge(state, {
            user: action.payload.user,
            addresses: action.payload.addresses,
            eventId: action.payload.eventId,
            plan: action.payload.plan,
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
