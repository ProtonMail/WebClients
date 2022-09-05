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
