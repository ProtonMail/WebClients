import { createAsyncThunk } from '@reduxjs/toolkit';

import { getImage } from '@proton/shared/lib/api/images';

import { get } from '../../../helpers/attachment/attachmentLoader';
import { preloadImage } from '../../../helpers/dom';
import { createBlob } from '../../../helpers/message/messageEmbeddeds';
import encodeImageUri from '../helpers/encodeImageUri';
import { LoadEmbeddedParams, LoadEmbeddedResults, LoadRemoteParams, LoadRemoteResults } from '../messagesTypes';

export const loadEmbedded = createAsyncThunk<LoadEmbeddedResults, LoadEmbeddedParams>(
    'messages/embeddeds/load',
    async ({ attachments, api, messageVerification, messageKeys, getAttachment, onUpdateAttachment }) => {
        return Promise.all(
            attachments.map(async (attachment) => {
                const buffer = await get(
                    attachment,
                    messageVerification,
                    messageKeys,
                    api,
                    getAttachment,
                    onUpdateAttachment
                );
                return {
                    attachment,
                    blob: createBlob(attachment, buffer.data as Uint8Array),
                };
            })
        );
    }
);

export const loadRemoteProxy = createAsyncThunk<LoadRemoteResults[], LoadRemoteParams>(
    'messages/remote/load/proxy',
    async ({ imagesToLoad, api }) => {
        return Promise.all(
            imagesToLoad.map(async (image) => {
                if (!image.url) {
                    return { image, error: 'No URL' };
                }

                try {
                    const encodedImageUrl = encodeImageUri(image.url);
                    const response: Response = await api({
                        ...getImage(encodedImageUrl),
                        output: 'raw',
                        silence: true,
                    });

                    return {
                        image,
                        blob: await response.blob(),
                        tracker: response.headers.get('x-pm-tracker-provider') || '',
                    };
                } catch (error) {
                    return { image, error };
                }
            })
        );
    }
);

export const loadFakeProxy = createAsyncThunk<LoadRemoteResults[], LoadRemoteParams>(
    'messages/remote/fake/proxy',
    async ({ imagesToLoad, api }) => {
        return Promise.all(
            imagesToLoad
                .filter((image) => image.tracker === undefined)
                .map(async (image) => {
                    if (!image.url) {
                        return { image, error: 'No URL' };
                    }

                    try {
                        const encodedImageUrl = encodeImageUri(image.url);
                        const response: Response = await api({
                            ...getImage(encodedImageUrl, 1),
                            output: 'raw',
                            silence: true,
                        });

                        return {
                            image,
                            tracker: response.headers.get('x-pm-tracker-provider') || '',
                        };
                    } catch (error) {
                        return { image, error };
                    }
                })
        );
    }
);

export const loadRemoteDirect = createAsyncThunk<LoadRemoteResults[], LoadRemoteParams>(
    'messages/remote/load/direct',
    async ({ imagesToLoad }) => {
        return Promise.all(
            imagesToLoad.map(async (image): Promise<LoadRemoteResults> => {
                try {
                    // First load, use url, second try, url is blank, use originalURL
                    const url = image.originalURL || image.url || '';
                    await preloadImage(url);
                    return { image };
                } catch (error) {
                    return { image, error };
                }
            })
        );
    }
);
