import { PayloadAction } from '@reduxjs/toolkit';
import { Draft } from 'immer';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { Attachment, Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import { setFlag } from '@proton/shared/lib/mail/messages';

import { replaceEmbeddedAttachments } from '../../../helpers/message/messageEmbeddeds';
import { getEmbeddedImages, updateImages } from '../../../helpers/message/messageImages';
import { getLocalID, getMessage } from '../helpers/messagesReducer';
import { MessageEmbeddedImage, MessageState, MessagesState, PartialMessageState } from '../messagesTypes';

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
        if (!messageState.draftFlags) {
            messageState.draftFlags = {};
        }
        messageState.draftFlags = {
            ...messageState.draftFlags,
            openDraftFromUndo: fromUndo,
            isSentDraft: false,
        };
        messageState.messageImages = undefined;
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

export const draftSaved = (
    state: Draft<MessagesState>,
    { payload: { ID, message } }: PayloadAction<{ ID: string; message: Message }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState && messageState.data) {
        messageState.data = message;
        messageState.messageImages = replaceEmbeddedAttachments(
            messageState.data as PartialMessageState,
            message.Attachments
        );
    } else {
        state[ID] = { localID: ID, data: message } as any;
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

export const endUndo = (state: Draft<MessagesState>, { payload: ID }: PayloadAction<string>) => {
    const message = getMessage(state, ID);

    if (message && message.data) {
        message.loadRetry = 0;
        message.data.LabelIDs = message.data.LabelIDs.filter((value) => value !== MAILBOX_LABEL_IDS.OUTBOX);
        message.data.Flags = setFlag(MESSAGE_FLAGS.FLAG_SENT)(message.data);
    }
};

export const sent = (state: Draft<MessagesState>, { payload: Sent }: PayloadAction<Message>) => {
    const message = getMessage(state, Sent.ID);

    if (message) {
        message.data = Sent;
        message.messageDocument = undefined;
        message.messageImages = undefined;
    }
};

export const endSending = (state: Draft<MessagesState>, { payload: ID }: PayloadAction<string>) => {
    const message = getMessage(state, ID);

    if (message && message.draftFlags) {
        message.draftFlags.sending = false;
    }
};

export const deleteDraft = (state: Draft<MessagesState>, { payload: ID }: PayloadAction<string>) => {
    const localID = getLocalID(state, ID);
    delete state[localID];
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
