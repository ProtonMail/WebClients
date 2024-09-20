import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { Optional, Recipient } from '@proton/shared/lib/interfaces';

import type { RecipientType } from '../../models/address';
import { globalReset } from '../actions';
import type { MessageState } from '../messages/messagesTypes';
import type { Composer, ComposerID, ComposersState } from './composerTypes';

export const composersInitialState: ComposersState = {
    composers: {},
};

const getComposerUID = (() => {
    let current = 0;
    return () => `composer-${current++}`;
})();

const name = 'composers';

const composersSlice = createSlice({
    name,
    initialState: composersInitialState,
    reducers: {
        addComposer(
            state,
            action: PayloadAction<
                Optional<
                    Pick<
                        Composer,
                        'messageID' | 'type' | 'senderEmailAddress' | 'recipients' | 'status' | 'forceOpenScheduleSend'
                    >,
                    'recipients'
                > & { ID?: string }
            >
        ) {
            const {
                ID = getComposerUID(),
                messageID,
                type,
                senderEmailAddress,
                recipients,
                status,
                forceOpenScheduleSend,
            } = action.payload;

            const composer = {
                ID,
                messageID,
                type,
                senderEmailAddress,
                changesCount: 0,
                recipients: {
                    ToList: recipients?.ToList || [],
                    CCList: recipients?.CCList || [],
                    BCCList: recipients?.BCCList || [],
                },
                status,
                forceOpenScheduleSend,
            } as Composer;

            state.composers[composer.ID] = composer;
        },
        setInitialized(state, action: PayloadAction<{ ID: ComposerID; message: MessageState }>) {
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

export const composersReducer = { [name]: composersSlice.reducer };
