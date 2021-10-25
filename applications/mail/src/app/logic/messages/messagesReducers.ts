import { Message, Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { isScheduledSend, isSent, isDraft as testIsDraft, setFlag } from '@proton/shared/lib/mail/messages';
import { EVENT_ACTIONS, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { canonizeEmail } from '@proton/shared/lib/helpers/email';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import { PayloadAction } from '@reduxjs/toolkit';
import { Draft } from 'immer';
import { hasLabel, parseLabelIDsInEvent } from '../../helpers/elements';
import { applyLabelChangesOnMessage, LabelChanges } from '../../helpers/labels';
import { markEmbeddedImagesAsLoaded, replaceEmbeddedAttachments } from '../../helpers/message/messageEmbeddeds';
import { getEmbeddedImages, getRemoteImages, updateImages } from '../../helpers/message/messageImages';
import {
    loadElementOtherThanImages,
    loadBackgroundImages,
    removeProtonPrefix,
    urlCreator,
} from '../../helpers/message/messageRemotes';
import { applyMarkAsChangesOnMessage } from '../../helpers/message/messages';
import { MarkAsChanges } from '../../hooks/optimistic/useOptimisticMarkAs';
import { LabelIDsChanges, MessageEvent } from '../../models/event';
import { RootState } from '../store';
import { localID as localIDSelector, messageByID } from './messagesSelectors';
import {
    DocumentInitializeParams,
    LoadEmbeddedParams,
    LoadEmbeddedResults,
    LoadParams,
    LoadRemoteParams,
    LoadRemoteProxyResults,
    MessageEmbeddedImage,
    MessageErrors,
    MessageRemoteImage,
    MessagesState,
    MessageState,
    PartialMessageState,
    VerificationParams,
} from './messagesTypes';

/**
 * Only takes technical stuff from the updated message
 */
export const mergeSavedMessage = (messageSaved: Draft<Message>, messageReturned: Message) => {
    Object.assign(messageSaved, {
        ID: messageReturned.ID,
        Time: messageReturned.Time,
        ConversationID: messageReturned.ConversationID,
        LabelIDs: messageReturned.LabelIDs,
    });
};

const getLocalID = (state: Draft<MessagesState>, ID: string) =>
    localIDSelector({ messages: state } as RootState, { ID });

const getMessage = (state: Draft<MessagesState>, ID: string) => messageByID({ messages: state } as RootState, { ID });

export const reset = (state: Draft<MessagesState>) => {
    Object.keys(state).forEach((ID) => {
        delete state[ID];
    });
};

export const initialize = (state: Draft<MessagesState>, action: PayloadAction<MessageState>) => {
    state[action.payload.localID] = action.payload as any; // TS error with writing Element
};

export const errors = (
    state: Draft<MessagesState>,
    { payload: { ID, errors } }: PayloadAction<{ ID: string; errors: MessageErrors }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        messageState.errors = errors;
    }
};

export const event = (state: Draft<MessagesState>, action: PayloadAction<MessageEvent>) => {
    const { Action, Message } = action.payload;

    const localID = getLocalID(state, action.payload.ID);

    if (Action === EVENT_ACTIONS.DELETE) {
        delete state[localID];
    }
    if (Action === EVENT_ACTIONS.UPDATE_DRAFT || Action === EVENT_ACTIONS.UPDATE_FLAGS) {
        const currentValue = state[localID] as MessageState;
        const isSentDraft = isSent(Message);
        const isScheduled = isScheduledSend(Message);
        const isDraft = testIsDraft(Message);

        if (currentValue.data) {
            const MessageToUpdate = parseLabelIDsInEvent(currentValue.data, Message as Message & LabelIDsChanges);

            // Draft updates can contains body updates but will not contains it in the event
            // By removing the current body value in the cache, we will reload it next time we need it
            if (Action === EVENT_ACTIONS.UPDATE_DRAFT) {
                if (!currentValue.draftFlags?.sending) {
                    currentValue.messageDocument = undefined;
                    currentValue.data.Body = undefined;
                }

                if (isSentDraft && !isScheduled) {
                    Object.assign(currentValue.draftFlags, { isSentDraft: true });
                }
            }

            // If not a draft, numAttachment will never change, but can be calculated client side for PGP messages
            if (!isDraft) {
                delete (MessageToUpdate as Partial<Message>).NumAttachments;
            }

            Object.assign(currentValue.data, MessageToUpdate);
        }
    }
};

export const loadFulfilled = (state: Draft<MessagesState>, { payload }: PayloadAction<Message>) => {
    const messageState = getMessage(state, payload.ID);

    if (messageState) {
        messageState.data = payload;
        messageState.loadRetry = messageState.loadRetry ? messageState.loadRetry + 1 : 1;
    }
};

export const loadRejected = (
    state: Draft<MessagesState>,
    {
        meta: {
            arg: { ID },
        },
    }: PayloadAction<unknown, string, { arg: LoadParams }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        messageState.loadRetry = messageState.loadRetry ? messageState.loadRetry + 1 : 1;
    }
};

export const documentInitializePending = (state: Draft<MessagesState>, { payload }: PayloadAction<string>) => {
    const messageState = getMessage(state, payload);

    if (messageState) {
        messageState.messageDocument = { initialized: false };
    }
};

export const documentInitializeFulfilled = (
    state: Draft<MessagesState>,
    {
        payload: { ID, dataChanges, initialized, preparation, decryption, errors, messageImages },
    }: PayloadAction<DocumentInitializeParams>
) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        Object.assign(messageState.data, dataChanges);
        if (messageState.messageDocument) {
            messageState.messageDocument.initialized = initialized;
            messageState.messageDocument.document = preparation?.document;
            messageState.messageDocument.plainText = preparation?.plainText;
        }
        messageState.decryption = decryption;
        messageState.errors = errors;
        messageState.loadRetry = messageState.loadRetry ? messageState.loadRetry + 1 : 1;
        messageState.messageImages = messageImages;
    }
};

export const verificationComplete = (
    state: Draft<MessagesState>,
    {
        payload: { ID, encryptionPreferences, verification, attachedPublicKeys, signingPublicKey, errors },
    }: PayloadAction<VerificationParams>
) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        messageState.verification = {
            senderPinnedKeys: encryptionPreferences?.pinnedKeys,
            signingPublicKey,
            attachedPublicKeys,
            senderVerified: encryptionPreferences?.isContactSignatureVerified,
            verificationStatus: verification?.verified,
            verificationErrors: verification?.verificationErrors,
        };
        messageState.errors = errors;
    }
};

export const resign = (
    state: Draft<MessagesState>,
    { payload: { ID, isContactSignatureVerified } }: PayloadAction<{ ID: string; isContactSignatureVerified?: boolean }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState && messageState.verification) {
        messageState.verification.senderVerified = isContactSignatureVerified;
    }
};

export const resetVerification = (state: Draft<MessagesState>, { payload: emails }: PayloadAction<string[]>) => {
    Object.values(state).forEach((message) => {
        const senderAddress = canonizeEmail(message?.data?.Sender.Address || '');
        if (message && emails.includes(senderAddress)) {
            message.verification = undefined;
        }
    });
};

export const loadEmbeddedFulfilled = (
    state: Draft<MessagesState>,
    {
        payload,
        meta: {
            arg: { ID },
        },
    }: PayloadAction<LoadEmbeddedResults, string, { arg: LoadEmbeddedParams }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState && messageState.messageImages) {
        const embeddedImages = getEmbeddedImages(messageState);
        const updatedEmbeddedImages = markEmbeddedImagesAsLoaded(embeddedImages, payload);

        messageState.messageImages = updateImages(
            messageState.messageImages,
            undefined,
            undefined,
            updatedEmbeddedImages
        );
    }
};

export const loadRemotePending = (
    state: Draft<MessagesState>,
    {
        meta: {
            arg: { ID, imagesToLoad },
        },
    }: PayloadAction<undefined, string, { arg: LoadRemoteParams }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        const imagesToLoadIDs = imagesToLoad.map((image) => image.id);
        getRemoteImages(messageState).forEach((image) => {
            if (imagesToLoadIDs.includes(image.id)) {
                // image.url = undefined;
                image.status = 'loading';
            }
        });
    }
};

export const loadRemoteProxyFulFilled = (
    state: Draft<MessagesState>,
    {
        payload,
        meta: {
            arg: { ID },
        },
    }: PayloadAction<LoadRemoteProxyResults[], string, { arg: LoadRemoteParams }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        const remoteImages = getRemoteImages(messageState);
        payload.forEach(({ image: inputImage, blob, tracker, error }) => {
            const image = remoteImages.find((image) => image.id === inputImage.id);
            if (image) {
                image.url = blob ? urlCreator().createObjectURL(blob) : undefined;
                image.originalURL = image.url;
                image.error = error;
                image.tracker = tracker;
                image.status = 'loaded';
            }
        });

        const imagesLoaded = payload.map(({ image }) => image);

        loadElementOtherThanImages(imagesLoaded, messageState.messageDocument?.document);

        loadBackgroundImages({ document: messageState.messageDocument?.document, images: imagesLoaded });
    }
};

export const loadFakeProxyFulFilled = (
    state: Draft<MessagesState>,
    {
        payload,
        meta: {
            arg: { ID },
        },
    }: PayloadAction<LoadRemoteProxyResults[], string, { arg: LoadRemoteParams }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        const remoteImages = getRemoteImages(messageState);
        payload.forEach(({ image: inputImage, tracker, error }) => {
            const image = remoteImages.find((image) => image.id === inputImage.id);
            if (image) {
                image.originalURL = image.url;
                image.error = error;
                image.tracker = tracker;
            }
        });
    }
};

export const loadRemoteDirectFulFilled = (
    state: Draft<MessagesState>,
    {
        payload,
        meta: {
            arg: { ID },
        },
    }: PayloadAction<[MessageRemoteImage, unknown][], string, { arg: LoadRemoteParams }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        const remoteImages = getRemoteImages(messageState);
        payload.forEach(([inputImage, error]) => {
            const image = remoteImages.find((image) => image.id === inputImage.id);
            if (image) {
                removeProtonPrefix(image.original as HTMLElement);
                image.error = error;
                image.status = 'loaded';
            }
        });

        const imagesLoaded = payload.map(([image]) => image);

        loadElementOtherThanImages(imagesLoaded, messageState.messageDocument?.document);

        loadBackgroundImages({ document: messageState.messageDocument?.document, images: imagesLoaded });
    }
};

export const optimisticApplyLabels = (
    state: Draft<MessagesState>,
    {
        payload: { ID, changes, unreadStatuses },
    }: PayloadAction<{ ID: string; changes: LabelChanges; unreadStatuses?: { id: string; unread: number }[] }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState && messageState.data) {
        messageState.data = applyLabelChangesOnMessage(messageState.data, changes, unreadStatuses);
    }
};

export const optimisticMarkAs = (
    state: Draft<MessagesState>,
    { payload: { ID, changes } }: PayloadAction<{ ID: string; changes: MarkAsChanges }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState && messageState.data) {
        messageState.data = applyMarkAsChangesOnMessage(messageState.data, changes);
    }
};

export const optimisticDelete = (state: Draft<MessagesState>, { payload: IDs }: PayloadAction<string[]>) => {
    IDs.forEach((ID) => {
        const localID = getLocalID(state, ID);
        delete state[localID];
    });
};

export const optimisticEmptyLabel = (state: Draft<MessagesState>, { payload: labelID }: PayloadAction<string>) => {
    Object.entries(state).forEach(([ID, message]) => {
        if (message && message.data && hasLabel(message.data, labelID)) {
            delete state[ID];
        }
    });
};

export const optimisticRestore = (
    state: Draft<MessagesState>,
    { payload: messages }: PayloadAction<MessageState[]>
) => {
    messages.forEach((message) => {
        state[message.localID] = message as any;
    });
};

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
        Object.assign(messageState.draftFlags, {
            openDraftFromUndo: fromUndo,
            isSentDraft: false,
            messageImages: undefined,
        });
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
        // mergeSavedMessage(messageState.data, message);
        // messageState.data.Attachments = message.Attachments;
        // messageState.data.Subject = message.Subject;
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
