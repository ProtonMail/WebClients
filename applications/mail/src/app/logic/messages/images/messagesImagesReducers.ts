import { PayloadAction } from '@reduxjs/toolkit';
import { Draft } from 'immer';

import { markEmbeddedImagesAsLoaded } from '../../../helpers/message/messageEmbeddeds';
import {
    forgeImageURL,
    getEmbeddedImages,
    getRemoteImages,
    updateImages,
} from '../../../helpers/message/messageImages';
import { loadBackgroundImages, loadImages, urlCreator } from '../../../helpers/message/messageRemotes';
import encodeImageUri from '../helpers/encodeImageUri';
import { getMessage } from '../helpers/messagesReducer';
import {
    LoadEmbeddedParams,
    LoadEmbeddedResults,
    LoadRemoteFromURLParams,
    LoadRemoteParams,
    LoadRemoteResults,
    MessageRemoteImage,
    MessageState,
    MessagesState,
} from '../messagesTypes';

// Get image refs in the state for those in data
const getStateImage = <T extends { image: MessageRemoteImage }>(data: T, messageState: MessageState) => {
    const remoteImages = getRemoteImages(messageState);

    const { image: inputImage, ...rest } = data;

    const image = remoteImages.find((image) => image.id === inputImage.id) as MessageRemoteImage;
    return { image, inputImage, ...rest };
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
            { showEmbeddedImages: true },
            undefined,
            updatedEmbeddedImages
        );
    }
};

export const loadRemotePending = (
    state: Draft<MessagesState>,
    {
        meta: {
            arg: { ID, imageToLoad },
        },
    }: PayloadAction<undefined, string, { arg: LoadRemoteParams }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        const imageToLoadState = getStateImage({ image: imageToLoad }, messageState);

        const { image, inputImage } = imageToLoadState;
        if (image) {
            image.status = 'loading';
            if (!image.originalURL) {
                image.originalURL = image.url;
            }
            image.error = undefined;
        } else if (messageState.messageImages && Array.isArray(messageState.messageImages.images)) {
            messageState.messageImages.images.push({
                ...inputImage,
                status: 'loading',
                originalURL: inputImage.url,
            });
        }
    }
};

export const loadRemoteProxyFulFilled = (
    state: Draft<MessagesState>,
    {
        payload,
        meta: {
            arg: { ID },
        },
    }: PayloadAction<LoadRemoteResults, string, { arg: LoadRemoteParams }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState && messageState.messageImages) {
        const { image, blob, tracker, error } = getStateImage(payload, messageState);

        image.url = blob ? urlCreator().createObjectURL(blob) : undefined;
        image.error = error;
        image.tracker = tracker;
        image.status = 'loaded';

        messageState.messageImages.showRemoteImages = true;

        loadImages([image], messageState.messageDocument?.document);

        loadBackgroundImages({ document: messageState.messageDocument?.document, images: [image] });
    }
};

export const loadRemoteProxyFromURL = (state: Draft<MessagesState>, action: PayloadAction<LoadRemoteFromURLParams>) => {
    const { imagesToLoad, ID, uid } = action.payload;

    const messageState = getMessage(state, ID);

    if (messageState) {
        imagesToLoad.forEach((imageToLoad) => {
            if (messageState.messageImages) {
                const imageToLoadState = getStateImage({ image: imageToLoad }, messageState);
                const { image, inputImage } = imageToLoadState;
                let newImage: MessageRemoteImage = { ...inputImage };

                if (imageToLoad.url && uid) {
                    const encodedImageUrl = encodeImageUri(imageToLoad.url);
                    const loadingURL = forgeImageURL(encodedImageUrl, uid);

                    // Image is already in state, we only need to put it as loaded
                    if (image) {
                        image.status = 'loaded';
                        image.originalURL = image.url;
                        image.error = undefined;
                        image.url = loadingURL;
                    } else if (Array.isArray(messageState.messageImages.images)) {
                        // Image not found in the state, we need to add it
                        newImage = {
                            ...newImage,
                            status: 'loaded',
                            originalURL: inputImage.url,
                            url: loadingURL,
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

export const loadFakeProxyPending = (
    state: Draft<MessagesState>,
    {
        meta: {
            arg: { ID, imageToLoad },
        },
    }: PayloadAction<undefined, string, { arg: LoadRemoteParams }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        getRemoteImages(messageState).forEach((image) => {
            if (imageToLoad.id === image.id) {
                image.originalURL = image.url;
            }
        });
    }
};

export const loadFakeProxyFulFilled = (
    state: Draft<MessagesState>,
    {
        payload,
        meta: {
            arg: { ID },
        },
    }: PayloadAction<LoadRemoteResults | undefined, string, { arg: LoadRemoteParams }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState && payload) {
        const { image, tracker, error } = getStateImage(payload, messageState);

        image.error = error;
        image.tracker = tracker;
    }
};

export const loadRemoteDirectFromURL = (
    state: Draft<MessagesState>,
    action: PayloadAction<LoadRemoteFromURLParams>
) => {
    const { imagesToLoad, ID } = action.payload;

    const messageState = getMessage(state, ID);

    if (messageState) {
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
