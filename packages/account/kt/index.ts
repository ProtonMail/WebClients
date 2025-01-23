import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';

interface State {
    value: KeyTransparencyActivation;
}

const name = 'kt' as const;

export interface KtState {
    [name]: State;
}

const defaultState: State = {
    value: KeyTransparencyActivation.DISABLED,
};

export const ktSlice = createSlice({
    name,
    initialState: defaultState,
    reducers: {
        value(state, action: PayloadAction<KeyTransparencyActivation>) {
            state.value = action.payload;
        },
    },
});
