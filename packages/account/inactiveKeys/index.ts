import { type PayloadAction, createSelector, createSlice } from '@reduxjs/toolkit';

import type { InactiveKey } from '@proton/shared/lib/interfaces';
import type { KeyReactivationRequest } from '@proton/shared/lib/keys';
import { getAllKeysReactivationRequests } from '@proton/shared/lib/keys/getInactiveKeys';

import { type AddressesState, selectAddresses } from '../addresses';
import { type UserState, selectUser } from '../user';

interface State {
    user: InactiveKey[];
    addresses: { [key: string]: InactiveKey[] };
}

const name = 'inactiveKeys' as const;

export interface InactiveKeysState {
    [name]: State;
}

const initialState: { user: InactiveKey[]; addresses: { [key: string]: InactiveKey[] } } = {
    user: [],
    addresses: {},
};
const slice = createSlice({
    name,
    initialState,
    reducers: {
        set: (state, action: PayloadAction<{ id: 'user' | string; value: InactiveKey[] }>) => {
            if (action.payload.id === 'user') {
                state.user = action.payload.value || [];
            } else {
                if (!action.payload.value?.length) {
                    if (state.addresses[action.payload.id]) {
                        delete state.addresses[action.payload.id];
                    }
                } else {
                    state.addresses[action.payload.id] = action.payload.value;
                }
            }
        },
    },
});

export const selectInactiveKeys = (state: InactiveKeysState) => state.inactiveKeys;

/** The keys the user can reactivate through a data recovery method, grouped per user and address. */
export const selectKeyReactivationRequests = createSelector(
    [
        (state: InactiveKeysState) => selectInactiveKeys(state),
        (state: UserState) => selectUser(state).value,
        (state: AddressesState) => selectAddresses(state).value,
    ],
    (inactiveKeys, user, addresses): KeyReactivationRequest[] => {
        return getAllKeysReactivationRequests({ addresses, user, inactiveKeys });
    }
);

export const inactiveKeysReducer = slice.reducer;
export const inactiveKeysActions = slice.actions;
