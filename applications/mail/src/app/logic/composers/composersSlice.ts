import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { Recipient } from '@proton/shared/lib/interfaces';

import { RecipientType } from '../../models/address';
import { globalReset } from '../actions';
import { Composer, ComposerID, ComposersState } from './composerTypes';

const initialState: ComposersState = {
    composers: {},
};

const getComposerUID = (() => {
    let current = 0;
    return () => `composer-${current++}`;
})();

const composersSlice = createSlice({
    name: 'composers',
    initialState,
    reducers: {
        addComposer(
            state,
            action: PayloadAction<Pick<Composer, 'messageID' | 'type' | 'senderEmailAddress' | 'recipients'>>
        ) {
            const composerID = getComposerUID();
            const { messageID, type, senderEmailAddress, recipients } = action.payload;

            state.composers[composerID] = {
                ID: composerID,
                messageID,
                type,
                senderEmailAddress,
                changesCount: 0,
                recipients,
            };
        },
        removeComposer(state, action: PayloadAction<{ ID: ComposerID }>) {
            delete state.composers[action.payload.ID];
        },
        setSender(state, action: PayloadAction<{ ID: ComposerID; emailAddress: string }>) {
            const { ID, emailAddress } = action.payload;
            state.composers[ID].senderEmailAddress = emailAddress;
            state.composers[ID].changesCount += 1;
        },
        setRecipients(state, action: PayloadAction<{ ID: ComposerID; type: RecipientType; recipients: Recipient[] }>) {
            const { ID, type, recipients } = action.payload;
            state.composers[ID].recipients[type] = recipients;
            state.composers[ID].changesCount += 1;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(globalReset, (state) => {
            Object.keys(state.composers).forEach((key) => delete state.composers[key]);
        });
    },
});

export const composerActions = composersSlice.actions;

export default composersSlice.reducer;
