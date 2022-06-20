import { PayloadAction } from '@reduxjs/toolkit';
import { Draft } from 'immer';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import { isPlainText, setFlag } from '@proton/shared/lib/mail/messages';

import { setDocumentContent } from '../../../helpers/message/messageContent';
import { replaceEmbeddedAttachments } from '../../../helpers/message/messageEmbeddeds';
import { getEmbeddedImages, updateImages } from '../../../helpers/message/messageImages';
import { RootState } from '../../store';
import { getLocalID, getMessage } from '../helpers/messagesReducer';
import { allMessages } from '../messagesSelectors';
import {
    MessageDraftFlags,
    MessageEmbeddedImage,
    MessageState,
    MessagesState,
    PartialMessageState,
} from '../messagesTypes';

const getAllMessages = (state: Draft<MessagesState>) => allMessages({ messages: state } as RootState);

export const createDraft = (state: Draft<MessagesState>, { payload: message }: PayloadAction<MessageState>) => {
    (state as MessagesState)[message.localID] = message;
};

export const openDraft = (
    state: Draft<MessagesState>,
    {
        payload: { ID, fromUndo, fromQuickReply },
    }: PayloadAction<{ ID: string; fromUndo: boolean; fromQuickReply?: boolean }>
) => {
    const localID = getLocalID(state, ID);
    const messageState = getMessage(state, ID);

    if (messageState) {
        // Drafts have a different sanitization as mail content
        // So we have to restart the sanitization process on a cached draft
        // If the message is opened from a quick reply, we don't want to restart the sanitization
        if (!fromQuickReply) {
            messageState.messageDocument = undefined;
            messageState.messageImages = undefined;
        }
        if (!messageState.draftFlags) {
            messageState.draftFlags = {};
        }
        messageState.draftFlags = {
            ...messageState.draftFlags,
            openDraftFromUndo: fromUndo,
            isSentDraft: false,
        };
    } else {
        state[localID] = { localID, draftFlags: { openDraftFromUndo: fromUndo } };
    }
};

export const removeInitialAttachments = (state: Draft<MessagesState>, { payload: ID }: PayloadAction<string>) => {
    const messageState = getMessage(state, ID);

    if (messageState && messageState.draftFlags) {
        messageState.draftFlags.initialAttachments = undefined;
    }
};

export const removeQuickReplyFlag = (state: Draft<MessagesState>, { payload: ID }: PayloadAction<string>) => {
    const messageState = getMessage(state, ID);

    if (messageState && messageState.draftFlags) {
        messageState.draftFlags.isQuickReply = undefined;
    }
};

export const removeAllQuickReplyFlags = (state: Draft<MessagesState>) => {
    const messages = getAllMessages(state);

    if (messages) {
        messages.forEach((message) => {
            if (message && message.draftFlags) {
                message.draftFlags.isQuickReply = undefined;
            }
        });
    }
};

export const updateIsSavingFlag = (
    state: Draft<MessagesState>,
    { payload: { ID, isSaving } }: PayloadAction<{ ID: string; isSaving: boolean }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState && messageState.draftFlags) {
        messageState.draftFlags.isSaving = isSaving;
    }
};

export const updateDraftContent = (
    state: Draft<MessagesState>,
    { payload: { ID, content } }: PayloadAction<{ ID: string; content: string }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        if (isPlainText(messageState.data)) {
            if (messageState.messageDocument) {
                messageState.messageDocument.plainText = content;
            } else {
                messageState.messageDocument = { plainText: content };
            }
        } else {
            const document = setDocumentContent(messageState.messageDocument?.document, content);
            if (messageState.messageDocument) {
                messageState.messageDocument.document = document;
            } else {
                messageState.messageDocument = { document };
            }
        }
    }
};

export const draftSaved = (
    state: Draft<MessagesState>,
    {
        payload: { ID, message, draftFlags },
    }: PayloadAction<{ ID: string; message: Message; draftFlags?: MessageDraftFlags }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState && messageState.data) {
        messageState.data = message;
        messageState.messageImages = replaceEmbeddedAttachments(
            messageState.data as PartialMessageState,
            message.Attachments
        );
    } else {
        state[ID] = { localID: ID, data: message, draftFlags: draftFlags } as any;
    }
};

export const updateScheduled = (
    state: Draft<MessagesState>,
    { payload: { ID, scheduledAt } }: PayloadAction<{ ID: string; scheduledAt: number }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        if (messageState.draftFlags) {
            messageState.draftFlags.scheduledAt = scheduledAt;
        } else {
            messageState.draftFlags = { scheduledAt };
        }
    }
};

export const updateExpires = (
    state: Draft<MessagesState>,
    { payload: { ID, expiresIn } }: PayloadAction<{ ID: string; expiresIn: number }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        if (messageState.draftFlags) {
            messageState.draftFlags.expiresIn = expiresIn;
        } else {
            messageState.draftFlags = { expiresIn };
        }
    }
};

export const startSending = (state: Draft<MessagesState>, { payload: ID }: PayloadAction<string>) => {
    const message = getMessage(state, ID);

    if (message && message.draftFlags) {
        message.draftFlags.sending = true;
    }
};

export const sendModifications = (
    state: Draft<MessagesState>,
    {
        payload: { ID, attachments, images },
    }: PayloadAction<{ ID: string; attachments: Attachment[]; images: MessageEmbeddedImage[] }>
) => {
    const message = getMessage(state, ID);

    if (message && message.data) {
        message.data.Attachments.push(...attachments);
        const embeddedImages = getEmbeddedImages(message);
        embeddedImages.push(...images);
        message.messageImages = updateImages(message.messageImages, undefined, undefined, embeddedImages);
    }
};

export const endUndo = (
    state: Draft<MessagesState>,
    { payload: { messageID, hasClickedUndo } }: PayloadAction<{ messageID: string; hasClickedUndo: boolean }>
) => {
    const message = getMessage(state, messageID);

    if (message && message.data) {
        message.loadRetry = 0;
        message.data.LabelIDs = message.data.LabelIDs.filter((value) => value !== MAILBOX_LABEL_IDS.OUTBOX);
        if (!hasClickedUndo) {
            message.data.Flags = setFlag(MESSAGE_FLAGS.FLAG_SENT)(message.data);
        }
    }
};

export const sent = (state: Draft<MessagesState>, { payload: Sent }: PayloadAction<Message>) => {
    const message = getMessage(state, Sent.ID);

    if (message) {
        message.data = Sent;
        message.messageDocument = undefined;
        message.messageImages = undefined;
        message.loadRetry = 0;
    }
};

export const endSending = (state: Draft<MessagesState>, { payload: ID }: PayloadAction<string>) => {
    const message = getMessage(state, ID);

    if (message && message.draftFlags) {
        message.draftFlags.sending = false;
    }
};

export const deleteDraft = (state: Draft<MessagesState>, { payload: ID }: PayloadAction<string>) => {
    /**
     * ID can be a messageID or a localID so we need to check for both
     */
    const index = Object.values(state).findIndex((message) => {
        if (message) {
            return message.data?.ID === ID || message.localID === ID;
        }
        return false;
    });

    if (index !== -1) {
        delete state[index];
    }
};

export const cancelScheduled = (state: Draft<MessagesState>, { payload: ID }: PayloadAction<string>) => {
    const message = getMessage(state, ID);

    if (message) {
        message.loadRetry = 0;
        if (message.draftFlags) {
            message.draftFlags.scheduledAt = undefined;
        }
    }
};

export const cancelSendSuccess = (state: Draft<MessagesState>, action: PayloadAction<Message>) => {
    const message = getMessage(state, action.payload.ID);

    if (message) {
        message.data = action.payload;
    }
};
