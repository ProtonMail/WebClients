import { createAsyncThunk } from '@reduxjs/toolkit';

import { getImage } from '@proton/shared/lib/api/images';
import { RESPONSE_CODE } from '@proton/shared/lib/drive/constants';

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

export const loadRemoteProxy = createAsyncThunk<LoadRemoteResults, LoadRemoteParams>(
    'messages/remote/load/proxy',
    async ({ imageToLoad, api }) => {
        if (!imageToLoad.url) {
            return { image: imageToLoad, error: 'No URL' };
        }

        try {
            const encodedImageUrl = encodeImageUri(imageToLoad.url);
            const response: Response = await api({
                ...getImage(encodedImageUrl),
                output: 'raw',
                silence: true,
            });

            // We want to cache loading errors on the browser (or android and ios), for that the BE is sending us 204
            // If we receive a 204 and a header x-pm-code with a code different than success code, we need to raise a "fake" error.
            // It does not fail, but we received nothing, we will need to load the image directly instead
            const responseCode = response.headers.get('x-pm-code') || '';
            if (response.status === 204 && +responseCode !== RESPONSE_CODE.SUCCESS) {
                return {
                    image: imageToLoad,
                    error: {
                        data: {
                            Code: 2902, // This code means proxy failed to load the image
                        },
                    },
                };
            }

            return {
                image: imageToLoad,
                blob: await response.blob(),
                tracker: response.headers.get('x-pm-tracker-provider') || '',
            };
        } catch (error) {
            return { image: imageToLoad, error };
        }
    }
);

export const loadFakeProxy = createAsyncThunk<LoadRemoteResults | undefined, LoadRemoteParams>(
    'messages/remote/fake/proxy',
    async ({ imageToLoad, api }) => {
        if (imageToLoad.tracker !== undefined) {
            return;
        }

        if (!imageToLoad.url) {
            return { image: imageToLoad, error: 'No URL' };
        }

        try {
            const encodedImageUrl = encodeImageUri(imageToLoad.url);
            const response: Response = await api({
                ...getImage(encodedImageUrl, 1),
                output: 'raw',
                silence: true,
            });

            return {
                image: imageToLoad,
                tracker: response.headers.get('x-pm-tracker-provider') || '',
            };
        } catch (error) {
            return { image: imageToLoad, error };
        }
    }
);

export const loadRemoteDirect = createAsyncThunk<LoadRemoteResults, LoadRemoteParams>(
    'messages/remote/load/direct',
    async ({ imageToLoad }) => {
        try {
            // First load, use url, second try, url is blank, use originalURL
            const url = imageToLoad.originalURL || imageToLoad.url || '';
            await preloadImage(url);
            return { image: imageToLoad };
        } catch (error) {
            return { image: imageToLoad, error };
        }
    }
);
