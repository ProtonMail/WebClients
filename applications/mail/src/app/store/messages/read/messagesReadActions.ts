import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import type {
    DocumentInitializeParams,
    LoadParams,
    MessageErrors,
    MessageState,
    VerificationParams,
} from '@proton/mail/store/messages/messagesTypes';
import { getMessage } from '@proton/shared/lib/api/messages';
import { wait } from '@proton/shared/lib/helpers/promise';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import type { MessageUTMTracker } from '@proton/shared/lib/models/mailUtmTrackers';

import { LOAD_RETRY_DELAY } from '../../../constants';
import type { MessageEvent } from '../../../models/event';
import type { MailState, MailThunkExtra } from '../../store';
import { messageByID } from '../messagesSelectors';

export const initialize = createAction<MessageState>('messages/initialize');

export const reload = createAction<{ ID: string }>('messages/reload');

export const errors = createAction<{ ID: string; errors: MessageErrors }>('messages/errors');

export const event = createAction<MessageEvent>('messages/event');

export const load = createAsyncThunk<Message, LoadParams, MailThunkExtra>(
    'messages/load',
    async ({ ID }, { getState, extra }) => {
        const messageState = messageByID(getState() as MailState, { ID });
        const actualID = messageState?.data?.ID || ID;

        // If the Body is already there, no need to send a request
        if (!messageState?.data?.Body) {
            try {
                const { Message: message } = await extra.api(getMessage(actualID));
                return message;
            } catch (error: any) {
                await wait(LOAD_RETRY_DELAY);
                throw error;
            }
        }

        return messageState?.data;
    }
);

export const documentInitializePending = createAction<string>('messages/document/initialize/pending');

export const documentInitializeFulfilled = createAction<DocumentInitializeParams>(
    'messages/document/initialize/fulfilled'
);

export const verificationComplete = createAction<VerificationParams>('messages/verification');

export const resign = createAction<{ ID: string; isContactSignatureVerified?: boolean }>('messages/resign');

export const resetVerification = createAction<string[]>('messages/verification/reset');

export const applyDarkStyle = createAction<{ ID: string; hasDarkStyle: boolean }>('messages/applyDarkStyle');

export const removeDarkStyle = createAction<{ ID: string; noDarkStyle: boolean }>('messages/removeDarkStyle');

export const cleanUTMTrackers = createAction<{ ID: string; utmTrackers: MessageUTMTracker[] }>(
    'messages/cleanUTMTrackers'
);
