import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { InactiveKey } from '@proton/shared/lib/interfaces';

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
