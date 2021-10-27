import { PayloadAction } from '@reduxjs/toolkit';
import { Draft } from 'immer';
import { markEmbeddedImagesAsLoaded } from '../../../helpers/message/messageEmbeddeds';
import { getEmbeddedImages, getRemoteImages, updateImages } from '../../../helpers/message/messageImages';
import {
    loadBackgroundImages,
    loadElementOtherThanImages,
    removeProtonPrefix,
    urlCreator,
} from '../../../helpers/message/messageRemotes';
import { getMessage } from '../helpers/messagesReducer';
import {
    LoadEmbeddedParams,
    LoadEmbeddedResults,
    LoadRemoteParams,
    LoadRemoteResults,
    MessageRemoteImage,
    MessagesState,
    MessageState,
} from '../messagesTypes';

// Get image refs in the state for those in data
const getStateImages = <T extends { image: MessageRemoteImage }>(data: T[], messageState: MessageState) => {
    const remoteImages = getRemoteImages(messageState);

    return data.map(({ image: inputImage, ...rest }) => {
        const image = remoteImages.find((image) => image.id === inputImage.id) as MessageRemoteImage;
        return { image, ...rest };
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
                image.status = 'loading';
                image.originalURL = image.url;
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
    }: PayloadAction<LoadRemoteResults[], string, { arg: LoadRemoteParams }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        const imagesLoaded = getStateImages(payload, messageState);

        imagesLoaded.forEach(({ image, blob, tracker, error }) => {
            image.url = blob ? urlCreator().createObjectURL(blob) : undefined;
            image.error = error;
            image.tracker = tracker;
            image.status = 'loaded';
        });

        const images = payload.map(({ image }) => image);

        loadElementOtherThanImages(images, messageState.messageDocument?.document);

        loadBackgroundImages({ document: messageState.messageDocument?.document, images });
    }
};

export const loadFakeProxyFulFilled = (
    state: Draft<MessagesState>,
    {
        payload,
        meta: {
            arg: { ID },
        },
    }: PayloadAction<LoadRemoteResults[], string, { arg: LoadRemoteParams }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        const imagesLoaded = getStateImages(payload, messageState);

        imagesLoaded.forEach(({ image, tracker, error }) => {
            image.error = error;
            image.tracker = tracker;
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
    }: PayloadAction<LoadRemoteResults[], string, { arg: LoadRemoteParams }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        const imagesLoaded = getStateImages(payload, messageState);

        imagesLoaded.forEach(({ image, error }) => {
            if (image) {
                removeProtonPrefix(image.original as HTMLElement);
                image.error = error;
                image.status = 'loaded';
            }
        });

        const images = payload.map(({ image }) => image);

        loadElementOtherThanImages(images, messageState.messageDocument?.document);

        loadBackgroundImages({ document: messageState.messageDocument?.document, images });
    }
};
