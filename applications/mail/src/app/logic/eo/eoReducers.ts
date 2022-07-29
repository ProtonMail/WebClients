import { PayloadAction } from '@reduxjs/toolkit';
import { Draft } from 'immer';

import { markEmbeddedImagesAsLoaded } from '../../helpers/message/messageEmbeddeds';
import { getEmbeddedImages, getRemoteImages, updateImages } from '../../helpers/message/messageImages';
import {
    loadBackgroundImages,
    loadElementOtherThanImages,
    removeProtonPrefix,
} from '../../helpers/message/messageRemotes';
import { MessageRemoteImage, MessageState } from '../messages/messagesTypes';
import { eoMessageSelector, eoMessageStateSelector } from './eoSelectors';
import { initialState } from './eoSlice';
import { RootState } from './eoStore';
import {
    EODocumentInitializeParams,
    EOInitParams,
    EOInitResult,
    EOLoadEmbeddedParams,
    EOLoadEmbeddedResults,
    EOLoadRemoteParams,
    EOLoadRemoteResults,
    EOMessage,
    EOMessageParams,
    EOMessageReply,
    EOState,
    EOTokenParams,
} from './eoType';

export const getMessageState = (state: Draft<EOState>) => eoMessageStateSelector({ eo: state } as RootState);

export const getEOMessage = (state: Draft<EOState>) => eoMessageSelector({ eo: state } as RootState);

// Get image refs in the state for those in data
const getStateImages = <T extends { image: MessageRemoteImage }>(data: T[], messageState: MessageState) => {
    const remoteImages = getRemoteImages(messageState);

    return data.map(({ image: inputImage, ...rest }) => {
        const image = remoteImages.find((image) => image.id === inputImage.id) as MessageRemoteImage;
        return { image, ...rest };
    });
};

export const reset = (state: Draft<EOState>) => {
    Object.assign(state, initialState);
};

export const initFulfilled = (
    state: Draft<EOState>,
    action: PayloadAction<EOInitResult, string, { arg: EOInitParams }>
) => {
    const { token, decryptedToken, password } = action.payload;

    if (token) {
        state.encryptedToken = token;
    }
    if (decryptedToken) {
        state.decryptedToken = decryptedToken;
    }
    if (password) {
        state.password = password;
    }
    state.isStoreInitialized = true;
};

export const loadEOTokenFulfilled = (
    state: Draft<EOState>,
    action: PayloadAction<string, string, { arg: EOTokenParams }>
) => {
    state.encryptedToken = action.payload;
};

export const loadEOMessageFulfilled = (
    state: Draft<EOState>,
    action: PayloadAction<{ eoMessage: EOMessage; messageState: MessageState }, string, { arg: EOMessageParams }>
) => {
    state.password = action.meta.arg.password;
    state.decryptedToken = action.meta.arg.token;
    state.message = action.payload.eoMessage as any;
    state.messageState = action.payload.messageState as any;
};

export const EODocumentInitializePending = (state: Draft<EOState>) => {
    state.messageState.messageDocument = { initialized: false };
};

export const EODocumentInitializeFulfilled = (
    state: Draft<EOState>,
    {
        payload: { dataChanges, initialized, preparation, decryption, errors, messageImages },
    }: PayloadAction<EODocumentInitializeParams>
) => {
    const messageState = getMessageState(state);

    if (messageState) {
        Object.assign(messageState.data!, dataChanges);
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

export const EOLoadEmbeddedFulfilled = (
    state: Draft<EOState>,
    { payload }: PayloadAction<EOLoadEmbeddedResults, string, { arg: EOLoadEmbeddedParams }>
) => {
    const messageState = getMessageState(state);

    if (messageState) {
        const embeddedImages = getEmbeddedImages(messageState);
        const updatedEmbeddedImages = markEmbeddedImagesAsLoaded(embeddedImages, payload);

        messageState.messageImages = updateImages(
            messageState.messageImages,
            { showEmbeddedImages: true },
            undefined,
            updatedEmbeddedImages
        );
    }
};

export const EOLoadRemotePending = (
    state: Draft<EOState>,
    {
        meta: {
            arg: { imagesToLoad },
        },
    }: PayloadAction<undefined, string, { arg: EOLoadRemoteParams }>
) => {
    const messageState = getMessageState(state);

    if (messageState) {
        const imagesToLoadIDs = imagesToLoad.map((image) => image.id);
        getRemoteImages(messageState).forEach((image) => {
            if (imagesToLoadIDs.includes(image.id)) {
                image.status = 'loading';
                image.originalURL = image.url;
            }
        });
    }
};

export const EOLoadRemoteFulfilled = (
    state: Draft<EOState>,
    { payload }: PayloadAction<EOLoadRemoteResults[], string, { arg: EOLoadRemoteParams }>
) => {
    const messageState = getMessageState(state);

    if (messageState && messageState.messageImages) {
        const imagesLoaded = getStateImages(payload, messageState);

        imagesLoaded.forEach(({ image, error }) => {
            if (image) {
                removeProtonPrefix(image.original as HTMLElement);
                image.error = error;
                image.status = 'loaded';
            }
        });

        messageState.messageImages.showRemoteImages = true;

        const images = payload.map(({ image }) => image);

        loadElementOtherThanImages(images, messageState.messageDocument?.document);

        loadBackgroundImages({ document: messageState.messageDocument?.document, images });
    }
};

export const EOAddReply = (state: Draft<EOState>, { payload: reply }: PayloadAction<EOMessageReply>) => {
    const message = getEOMessage(state);

    if (message) {
        message.Replies.push(reply);
    }
};
