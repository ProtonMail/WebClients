import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import type { MessageDraftFlags, MessageEmbeddedImage, MessageState } from '@proton/mail/store/messages/messagesTypes';
import { cancelSend as cancelSendApiCall } from '@proton/shared/lib/api/messages';
import type { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';

import type { MailThunkExtra } from '../../store';

export const createDraft = createAction<MessageState>('message/draft/create');

export const openDraft = createAction<{ ID: string; fromUndo: boolean }>('messages/draft/open');

export const removeInitialAttachments = createAction<string>('messages/draft/removeInitialAttachments');

export const updateDraftContent = createAction<{ ID: string; content: string }>('message/draft/update');

export const draftSaved = createAction<{ ID: string; message: Message; draftFlags?: MessageDraftFlags }>(
    'message/draft/saved'
);

export const updateExpires = createAction<{ ID: string; expiresIn: Date | undefined }>('message/expires/update');

export const startSending = createAction<string>('messages/send/start');

export const sendModifications = createAction<{
    ID: string;
    attachments: Attachment[];
    images: MessageEmbeddedImage[];
}>('messages/send/modifications');

export const endUndo = createAction<{ messageID: string; hasClickedUndo: boolean }>('message/send/endUndo');

export const sent = createAction<Message>('message/send/sent');

export const endSending = createAction<string>('messages/send/end');

/**
 * @param {string} messageID MessageID can be the draft LocalID or the data ID. message.data.ID has priority for deletion
 * @example dispatch(deleteDraft(message.data.ID || message.ID));
 */
export const deleteDraft = createAction<string>('messages/deleteDraft');

export const cancelSendMessage = createAsyncThunk<Message, { messageID: string }, MailThunkExtra>(
    'message/send/cancel',
    async ({ messageID }, { extra }) => {
        const results = await extra.api<{ Code: number; Message: Message }>(cancelSendApiCall(messageID));

        return results.Message;
    }
);
