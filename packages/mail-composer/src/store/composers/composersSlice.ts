import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { Recipient } from '@proton/shared/lib/interfaces/Address';
import type { MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';

import type { Composer, ComposerID, ComposerRecipients, ComposersState } from './composerTypes';

export const composersInitialState: ComposersState = {
    composers: {},
    hasFocusedComposer: false,
};

const name = 'composers';

const composersSlice = createSlice({
    name,
    initialState: composersInitialState,
    reducers: {
        /** Check `addComposerAction` in `composerActions.ts` */
        addComposer(state, action: PayloadAction<Composer>) {
            state.composers[action.payload.ID] = action.payload;
        },
        setInitialized(
            state,
            action: PayloadAction<{
                ID: ComposerID;
                message: { data?: Pick<MessageMetadata, 'Sender' | 'ToList' | 'CCList' | 'BCCList'> };
            }>
        ) {
            state.composers[action.payload.ID].senderEmailAddress = action.payload.message?.data?.Sender?.Address;
            state.composers[action.payload.ID].recipients = {
                ToList: action.payload.message.data?.ToList || [],
                CCList: action.payload.message.data?.CCList || [],
                BCCList: action.payload.message.data?.BCCList || [],
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
        setRecipients(
            state,
            action: PayloadAction<{ ID: ComposerID; type: keyof ComposerRecipients; recipients: Recipient[] }>
        ) {
            const { ID, type, recipients } = action.payload;
            state.composers[ID].recipients[type] = recipients;
            state.composers[ID].changesCount += 1;
        },
        toggleMinimizeComposer(state, action: PayloadAction<ComposerID>) {
            state.composers[action.payload].isMinimized = !state.composers[action.payload].isMinimized;
        },
        toggleMaximizeComposer(state, action: PayloadAction<ComposerID>) {
            const nextMaximizeValue = !state.composers[action.payload].isMaximized;

            state.composers[action.payload].isMinimized = false;
            state.composers[action.payload].isMaximized = nextMaximizeValue;
        },
        setHasFocusedComposer(state, action: PayloadAction<boolean>) {
            state.hasFocusedComposer = action.payload;
        },
    },
});

export const composerActions = composersSlice.actions;

export const composersReducer = { [name]: composersSlice.reducer };
