import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import { cancelSend as cancelSendApiCall } from '@proton/shared/lib/api/messages';
import { Api } from '@proton/shared/lib/interfaces';
import { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';

import { MessageEmbeddedImage, MessageState } from '../messagesTypes';

export const createDraft = createAction<MessageState>('message/draft/create');

export const openDraft = createAction<{ ID: string; fromUndo: boolean }>('messages/draft/open');

export const removeInitialAttachments = createAction<string>('messages/draft/removeInitialAttachments');

export const draftSaved = createAction<{ ID: string; message: Message }>('message/draft/saved');

export const updateScheduled = createAction<{ ID: string; scheduledAt: number }>('message/scheduled/update');

export const updateExpires = createAction<{ ID: string; expiresIn: number }>('message/expires/update');

export const startSending = createAction<string>('messages/send/start');

export const sendModifications = createAction<{
    ID: string;
    attachments: Attachment[];
    images: MessageEmbeddedImage[];
}>('messages/send/modifications');

export const endUndo = createAction<{ messageID: string; hasClickedUndo: boolean }>('message/send/endUndo');

export const sent = createAction<Message>('message/send/sent');

export const endSending = createAction<string>('messages/send/end');

export const deleteDraft = createAction<string>('messages/deleteDraft');

export const cancelSendMessage = createAsyncThunk<Message, { messageID: string; api: Api }>(
    'message/send/cancel',
    async ({ api, messageID }) => {
        const results = await api<{ Code: number; Message: Message }>(cancelSendApiCall(messageID));

        return results.Message;
    }
);

export const cancelScheduled = createAction<string>('message/scheduled/cancel');
