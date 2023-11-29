import { createSelector } from '@reduxjs/toolkit';
import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { baseUseSelector } from '@proton/redux-shared-store';
import type { InactiveKey } from '@proton/shared/lib/interfaces';
import { getAllKeysReactivationRequests } from '@proton/shared/lib/keys/getInactiveKeys';
import { KeyReactivationRequest } from '@proton/shared/lib/keys/reactivation/interface';

import { AddressesState, selectAddresses } from '../addresses';
import { UserState, selectUser } from '../user';

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

export const inactiveKeysReducer = slice.reducer;
export const inactiveKeysActions = slice.actions;

type Result = KeyReactivationRequest[];

const selector = createSelector(
    [
        (state: InactiveKeysState) => selectInactiveKeys(state),
        (state: UserState) => selectUser(state).value,
        (state: AddressesState) => selectAddresses(state).value,
    ],
    (inactiveKeys, user, addresses): Result => {
        return getAllKeysReactivationRequests({ addresses, user, inactiveKeys });
    }
);

export const useInactiveKeys = () => {
    return baseUseSelector<InactiveKeysState & UserState & AddressesState, Result>(selector);
};
