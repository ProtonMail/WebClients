import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { isScheduledSend, isSent, isDraft as testIsDraft } from '@proton/shared/lib/mail/messages';
import { PayloadAction } from '@reduxjs/toolkit';
import { Draft } from 'immer';
import { parseLabelIDsInEvent } from '../../helpers/elements';
import { markEmbeddedImagesAsLoaded } from '../../helpers/message/messageEmbeddeds';
import { getEmbeddedImages, getRemoteImages, updateImages } from '../../helpers/message/messageImages';
import {
    loadElementOtherThanImages,
    loadBackgroundImages,
    removeProtonPrefix,
    urlCreator,
} from '../../helpers/message/messageRemotes';
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
    MessageRemoteImage,
    MessagesState,
    MessageState,
} from './messagesTypes';

const getLocalID = (state: Draft<MessagesState>, ID: string) =>
    localIDSelector({ messages: state } as RootState, { ID });

const getMessage = (state: Draft<MessagesState>, ID: string) => messageByID({ messages: state } as RootState, { ID });

export const initialize = (state: Draft<MessagesState>, action: PayloadAction<MessageState>) => {
    state[action.payload.localID] = action.payload as any; // TS error with writing Element
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
