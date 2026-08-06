import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type OrganizationState, organizationThunk, serverEvent } from '@proton/account';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities/creator';
import { createHooks } from '@proton/redux-utilities/hooks';
import { getInitialModelState } from '@proton/redux-utilities/initialModelState';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';
import { queryMessageCount } from '@proton/shared/lib/api/messages';
import type { LabelCount } from '@proton/shared/lib/interfaces';
import type { MessageMetadata } from '@proton/shared/lib/interfaces/mail/Message';

import { type MailSettingState, mailSettingsThunk } from '../mailSettings';
import { getCountQueryParams } from './countHelpers';
import {
    labelConversationsPending,
    labelMessages,
    markMessagesAsRead,
    markMessagesAsUnread,
    unlabelConversationsPending,
    unlabelMessages,
} from './messageCountsReducers';

const name = 'messageCounts' as const;

export interface MessageCountsState extends MailSettingState, OrganizationState {
    [name]: ModelState<LabelCount[]>;
}

type SliceState = MessageCountsState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectMessageCounts = (state: MessageCountsState) => state[name];

const modelThunk = createAsyncModelThunk<Model, MessageCountsState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ dispatch, extraArgument }) => {
        const [mailSettings, organization] = await Promise.all([
            dispatch(mailSettingsThunk()),
            dispatch(organizationThunk()),
        ]);
        const options = getCountQueryParams(organization, mailSettings);

        return extraArgument.api(queryMessageCount(options)).then(({ Counts }) => Counts);
    },
    previous: previousSelector(selectMessageCounts),
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {
        set: (state, action: PayloadAction<LabelCount[]>) => {
            state.value = action.payload;
        },
        markMessagesAsReadPending: (
            state,
            action: PayloadAction<{
                messages: MessageMetadata[];
                labelID: string;
            }>
        ) => {
            markMessagesAsRead(state, action);
        },
        markMessagesAsUnreadPending: (
            state,
            action: PayloadAction<{
                messages: MessageMetadata[];
                labelID: string;
            }>
        ) => {
            markMessagesAsUnread(state, action);
        },
        markMessagesAsReadRejected: (state, action) => {
            markMessagesAsUnread(state, action);
        },
        markMessagesAsUnreadRejected: (state, action) => {
            markMessagesAsRead(state, action);
        },
        labelMessagesPending: (state, action) => {
            labelMessages(state, action);
        },
        unlabelMessagesPending: (state, action) => {
            unlabelMessages(state, action);
        },
        labelConversationsPending: (state, action) => {
            labelConversationsPending(state, action);
        },
        unlabelConversationsPending: (state, action) => {
            unlabelConversationsPending(state, action);
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(serverEvent, (state, action) => {
            if (state.value && action.payload.MessageCounts) {
                state.value = action.payload.MessageCounts;
            }
        });
    },
});

export const messageCountsReducer = { [name]: slice.reducer };
export const messageCountsThunk = modelThunk.thunk;
export const messageCountsActions = slice.actions;

const hooks = createHooks(messageCountsThunk, selectMessageCounts);

export const useMessageCounts = hooks.useValue;
export const useGetMessageCounts = hooks.useGet;
