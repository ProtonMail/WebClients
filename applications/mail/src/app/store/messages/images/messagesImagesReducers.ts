import type { PayloadAction } from '@reduxjs/toolkit';
import type { Draft } from 'immer';

import type {
    LoadEmbeddedParams,
    LoadEmbeddedResults,
    LoadFakeRemoteParams,
    LoadRemoteFromURLParams,
    LoadRemoteParams,
    LoadRemoteResults,
    MessageRemoteImage,
    MessageState,
    MessagesState,
} from '@proton/mail/store/messages/messagesTypes';
import { encodeImageUri, forgeImageURL } from '@proton/shared/lib/helpers/image';

import config from '../../../config';
import { insertBlobImages, markEmbeddedAsLoaded, replaceEmbeddedUrls } from '../../../helpers/message/messageEmbeddeds';
import { getEmbeddedImages, getRemoteImages, updateImages } from '../../../helpers/message/messageImages';
import { loadBackgroundImages, loadImages, urlCreator } from '../../../helpers/message/messageRemotes';
import { getMessage } from '../helpers/messagesReducer';

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
            arg: { ID, isDraft },
        },
    }: PayloadAction<LoadEmbeddedResults, string, { arg: LoadEmbeddedParams }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState && messageState.messageImages) {
        const embeddedImages = getEmbeddedImages(messageState);

        // First, get urls from blob
        let updatedEmbeddedImages = replaceEmbeddedUrls(embeddedImages, payload);

        // If we are initializing images on a draft, insert them in the content
        if (isDraft && messageState.messageDocument?.document) {
            insertBlobImages(messageState.messageDocument.document, updatedEmbeddedImages);
        }

        // Then we can mark images as loaded
        // They are mot marked directly when replacing urls,
        // because this would trigger a rerender in the composer too early, and we would not display them
        updatedEmbeddedImages = markEmbeddedAsLoaded(updatedEmbeddedImages, payload);

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
                    const loadingURL = forgeImageURL({
                        apiUrl: config.API_URL,
                        url: encodedImageUrl,
                        uid,
                        origin: window.location.origin,
                    });

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
            arg: { ID, imagesToLoad, firstLoad },
        },
    }: PayloadAction<undefined, string, { arg: LoadFakeRemoteParams }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState) {
        if (messageState.messageImages) {
            messageState.messageImages.trackersStatus = 'loading';
        }

        // If we want to get the number of trackers but images are not already loaded (Auto show is OFF but use Proton proxy is ON)
        // Then we want to display the correct number of trackers in the shield icon. But for that, we need to fill images with their original URLs
        // Otherwise, we will not be able to display the correct number (they will all have a originalUrl = "", which will be considered as one tracker)
        if (firstLoad) {
            getRemoteImages(messageState).forEach((image) => {
                imagesToLoad.forEach((imageToLoad) => {
                    if (imageToLoad.id === image.id) {
                        image.originalURL = image.url;
                    }
                });
            });
        }
    }
};

export const loadFakeProxyFulFilled = (
    state: Draft<MessagesState>,
    {
        payload,
        meta: {
            arg: { ID },
        },
    }: PayloadAction<(LoadRemoteResults | undefined)[] | undefined, string, { arg: LoadFakeRemoteParams }>
) => {
    const messageState = getMessage(state, ID);

    if (messageState && payload) {
        payload.forEach((imageToLoad) => {
            if (imageToLoad) {
                const { image, tracker, error } = getStateImage(imageToLoad, messageState);

                if (image) {
                    if (!!error) {
                        image.error = error;
                    }
                    image.tracker = tracker;
                }
            }
        });

        if (messageState.messageImages) {
            messageState.messageImages.trackersStatus = 'loaded';
        }
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

export const failedRemoteDirectLoading = (
    state: Draft<MessagesState>,
    action: PayloadAction<{ ID: string; image: MessageRemoteImage }>
) => {
    const { image: failedImage, ID } = action.payload;

    const messageState = getMessage(state, ID);

    if (messageState) {
        const imageFromState = getStateImage({ image: failedImage }, messageState);
        const { image } = imageFromState;

        // We set an error just to see a placeholder in the message view
        image.error = 'Could not load the image without using proxy';
    }
};

export const loadFakeTrackers = (state: Draft<MessagesState>, action: PayloadAction<{ ID: string }>) => {
    const { ID } = action.payload;

    const messageState = getMessage(state, ID);

    if (messageState && messageState.messageImages) {
        messageState.messageImages.trackersStatus = 'loaded';
    }
};
