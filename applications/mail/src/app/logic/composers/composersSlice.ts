import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import generateUID from '@proton/atoms/generateUID';

import { Composer, ComposersState } from './composerTypes';

const initialState: ComposersState = {
    composers: {},
};

const composersSlice = createSlice({
    name: 'composers',
    initialState,
    reducers: {
        addComposer(state, action: PayloadAction<{ messageID: Composer['messageID'] }>) {
            const composerID = generateUID('composer-');
            state.composers[composerID] = {
                ID: composerID,
                messageID: action.payload.messageID,
            };
        },
        removeComposer(state, action: PayloadAction<{ messageID: Composer['messageID'] }>) {
            const composerID = Object.values(state.composers).find(
                (composer) => composer.messageID === action.payload.messageID
            )?.ID;

            if (composerID) {
                delete state.composers[composerID];
            }
        },
    },
});

export const composerActions = composersSlice.actions;

export default composersSlice.reducer;
