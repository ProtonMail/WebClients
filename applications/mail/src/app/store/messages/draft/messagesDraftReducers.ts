import type { PayloadAction } from '@reduxjs/toolkit';
import type { Draft } from 'immer';

import type {
    MessageDraftFlags,
    MessageEmbeddedImage,
    MessageState,
    MessagesState,
    PartialMessageState,
} from '@proton/mail/store/messages/messagesTypes';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import { isPlainText, setFlag } from '@proton/shared/lib/mail/messages';

import { setDocumentContent } from '../../../helpers/message/messageContent';
import { replaceEmbeddedAttachments } from '../../../helpers/message/messageEmbeddeds';
import { getEmbeddedImages, updateImages } from '../../../helpers/message/messageImages';
import { getLocalID, getMessage } from '../helpers/messagesReducer';

export const createDraft = (state: Draft<MessagesState>, { payload: message }: PayloadAction<MessageState>) => {
    (state as MessagesState)[message.localID] = message;
};

export const openDraft = (
    state: Draft<MessagesState>,
    { payload: { ID, fromUndo } }: PayloadAction<{ ID: string; fromUndo: boolean }>
) => {
    const localID = getLocalID(state, ID);
    const messageState = getMessage(state, ID);

    if (messageState) {
        // Drafts have a different sanitization as mail content
        // So we have to restart the sanitization process on a cached draft
        messageState.messageDocument = undefined;
        messageState.messageImages = undefined;

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

export const updateExpires = (
    state: Draft<MessagesState>,
    { payload: { ID, expiresIn } }: PayloadAction<{ ID: string; expiresIn: Date | undefined }>
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
        message.data = {
            ...Sent,
            // Keep password in case the user is undoing send
            Password: message.data?.Password,
            PasswordHint: message.data?.PasswordHint,
        };
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

export const cancelSendSuccess = (state: Draft<MessagesState>, action: PayloadAction<Message>) => {
    const message = getMessage(state, action.payload.ID);

    if (message) {
        message.data = {
            ...action.payload,
            // Keep password in case the user is undoing send
            Password: message.data?.Password,
            PasswordHint: message.data?.PasswordHint,
        };
    }
};
