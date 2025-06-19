import type { PayloadAction } from '@reduxjs/toolkit';
import type { Draft } from 'immer';

import type { MessageRemoteImage, MessageState } from '@proton/mail/store/messages/messagesTypes';

import type { EOStoreState } from 'proton-mail/store/eo/eoStore';

import { markEmbeddedImagesAsLoaded } from '../../helpers/message/messageEmbeddeds';
import { getEmbeddedImages, getRemoteImages, updateImages } from '../../helpers/message/messageImages';
import { loadBackgroundImages, loadImages } from '../../helpers/message/messageRemotes';
import { eoMessageSelector, eoMessageStateSelector } from './eoSelectors';
import { initialState } from './eoSlice';
import type {
    EODocumentInitializeParams,
    EOInitParams,
    EOInitResult,
    EOLoadEmbeddedParams,
    EOLoadEmbeddedResults,
    EOLoadRemoteParams,
    EOMessage,
    EOMessageParams,
    EOMessageReply,
    EOState,
    EOTokenParams,
} from './eoType';

export const getMessageState = (state: Draft<EOState>) => eoMessageStateSelector({ eo: state } as EOStoreState);

export const getEOMessage = (state: Draft<EOState>) => eoMessageSelector({ eo: state } as EOStoreState);

const getStateImage = <T extends { image: MessageRemoteImage }>(data: T, messageState: MessageState) => {
    const remoteImages = getRemoteImages(messageState);

    const { image: inputImage, ...rest } = data;

    const image = remoteImages.find((image) => image.id === inputImage.id) as MessageRemoteImage;
    return { image, inputImage, ...rest };
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
        state.isEncryptedTokenInitialized = true;
    }
    if (decryptedToken) {
        state.decryptedToken = decryptedToken;
    }
    if (password) {
        state.password = password;
    }
    state.isStoreInitialized = true;
};

export const initEncryptedToken = (state: Draft<EOState>) => {
    state.isEncryptedTokenInitialized = true;
};

export const loadEOTokenFulfilled = (
    state: Draft<EOState>,
    action: PayloadAction<string, string, { arg: EOTokenParams }>
) => {
    state.encryptedToken = action.payload;
    state.isEncryptedTokenInitialized = true;
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

export const EOLoadRemote = (
    state: Draft<EOState>,
    // action: PayloadAction<LoadRemoteFromURLParams>
    action: PayloadAction<EOLoadRemoteParams>
) => {
    const { imagesToLoad } = action.payload;
    const messageState = getMessageState(state);

    if (messageState && messageState.messageImages) {
        imagesToLoad.forEach((imageToLoad) => {
            if (messageState.messageImages) {
                const imageToLoadState = getStateImage({ image: imageToLoad }, messageState);
                const { image, inputImage } = imageToLoadState;
                let newImage: MessageRemoteImage = { ...inputImage };

                if (imageToLoad.url || imageToLoad.originalURL) {
                    // Image is already in state, we only need to put it as loaded
                    if (image) {
                        image.status = 'loaded';
                        image.error = undefined;
                        if (image.url) {
                            image.originalURL = image.url;
                        } else {
                            // When using load direct, imageToLoad.url might have been removed
                            image.url = imageToLoad.originalURL;
                            image.originalURL = imageToLoad.url;
                        }
                    } else if (Array.isArray(messageState.messageImages.images)) {
                        // Image not found in the state, we need to add it
                        newImage = {
                            ...newImage,
                            status: 'loaded',
                            originalURL: inputImage.url,
                            url: inputImage.url,
                        };
                        messageState.messageImages.images.push(newImage);
                    }

                    messageState.messageImages.showRemoteImages = true;

                    loadImages([image ? image : newImage], messageState.messageDocument?.document);

                    loadBackgroundImages({
                        document: messageState.messageDocument?.document,
                        images: [image ? image : newImage],
                    });
                } else {
                    if (image) {
                        image.error = 'No URL';
                    } else if (Array.isArray(messageState.messageImages.images)) {
                        messageState.messageImages.images.push({
                            ...inputImage,
                            error: 'No URL',
                            status: 'loaded',
                        });
                    }
                }
            }
        });
    }
};

export const EOAddReply = (state: Draft<EOState>, { payload: reply }: PayloadAction<EOMessageReply>) => {
    const message = getEOMessage(state);

    if (message) {
        message.Replies.push(reply);
    }
};
