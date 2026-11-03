import { combineReducers, configureStore, createSlice } from '@reduxjs/toolkit';

import { internalBookingReducer } from '@proton/calendar/bookings/store';
import { addAttachmentsCases } from '@proton/mail-message/store/attachments/attachmentsCases';
import type { AttachmentsState } from '@proton/mail-message/store/attachments/attachmentsTypes';
import { addContactsCases } from '@proton/mail-message/store/contacts/contactsCases';
import { mailContactsInitialState } from '@proton/mail-message/store/contacts/contactsInitialState';
import { addMessagesCases } from '@proton/mail-message/store/messages/messagesCases';
import type { MessagesState } from '@proton/mail-message/store/messages/messagesTypes';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { sharedReducers } from '@proton/redux-shared-store/sharedReducers';
import { apiMock } from '@proton/test-api/api';

import { composersReducer } from '../store/composers/composersSlice';

const messagesSlice = createSlice({
    name: 'messages',
    initialState: {} as MessagesState,
    reducers: {},
    extraReducers: addMessagesCases,
});

const attachmentsSlice = createSlice({
    name: 'attachments',
    initialState: {} as AttachmentsState,
    reducers: {},
    extraReducers: addAttachmentsCases,
});

const mailContactsSlice = createSlice({
    name: 'mailContacts',
    initialState: mailContactsInitialState,
    reducers: {},
    extraReducers: addContactsCases,
});

const composerTestReducer = combineReducers({
    ...sharedReducers,
    ...internalBookingReducer,
    ...composersReducer,
    messages: messagesSlice.reducer,
    attachments: attachmentsSlice.reducer,
    mailContacts: mailContactsSlice.reducer,
});

export type ComposerTestState = ReturnType<typeof composerTestReducer>;

export const composerTestThunkArguments = { api: apiMock } as unknown as ProtonThunkArguments;

export const setupComposerTestStore = ({ preloadedState }: { preloadedState?: Partial<ComposerTestState> } = {}) =>
    configureStore({
        preloadedState,
        reducer: composerTestReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: false,
                immutableCheck: false,
                thunk: { extraArgument: composerTestThunkArguments },
            }),
    });

export type ComposerTestStore = ReturnType<typeof setupComposerTestStore>;
