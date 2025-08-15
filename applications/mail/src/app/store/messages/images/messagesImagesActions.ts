import { createAction, createAsyncThunk } from '@reduxjs/toolkit';

import type {
    LoadEmbeddedParams,
    LoadEmbeddedResults,
    LoadFakeRemoteParams,
    LoadRemoteFromURLParams,
    LoadRemoteParams,
    LoadRemoteResults,
    MessageRemoteImage,
} from '@proton/mail/store/messages/messagesTypes';
import { getImage } from '@proton/shared/lib/api/images';
import { RESPONSE_CODE } from '@proton/shared/lib/drive/constants';
import { encodeImageUri } from '@proton/shared/lib/helpers/image';

import { getAndVerifyAttachment } from '../../../helpers/attachment/attachmentLoader';
import { createBlob } from '../../../helpers/message/messageEmbeddeds';

export const loadEmbedded = createAsyncThunk<LoadEmbeddedResults, LoadEmbeddedParams>(
    'messages/embeddeds/load',
    async ({ attachments, api, messageVerification, messageKeys, getAttachment, onUpdateAttachment, messageFlags }) => {
        return Promise.all(
            attachments.map(async (attachment) => {
                const buffer = await getAndVerifyAttachment(
                    attachment,
                    messageVerification,
                    messageKeys,
                    api,
                    getAttachment,
                    onUpdateAttachment,
                    messageFlags
                );
                return {
                    attachment,
                    blob: createBlob(attachment, buffer.data as Uint8Array<ArrayBuffer>),
                };
            })
        );
    }
);

const REMOTE_PROXY_CACHE = {} as { [url: string]: Promise<Response> };

export const loadRemoteProxy = createAsyncThunk<LoadRemoteResults, LoadRemoteParams>(
    'messages/remote/load/proxy',
    async ({ imageToLoad, api }) => {
        if (!imageToLoad.url) {
            return { image: imageToLoad, error: 'No URL' };
        }

        try {
            const encodedImageUrl = encodeImageUri(imageToLoad.url);
            let promise = REMOTE_PROXY_CACHE[encodedImageUrl];

            if (!promise) {
                promise = api({
                    ...getImage(encodedImageUrl),
                    output: 'raw',
                    silence: true,
                });
                REMOTE_PROXY_CACHE[encodedImageUrl] = promise;
            }

            const response = await promise;

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

export const loadRemoteProxyFromURL = createAction<LoadRemoteFromURLParams>('messages/remote/load/proxy/url');

export const loadFakeProxy = createAsyncThunk<(LoadRemoteResults | undefined)[] | undefined, LoadFakeRemoteParams>(
    'messages/remote/fake/proxy',
    async ({ imagesToLoad, api }) => {
        return Promise.all(
            imagesToLoad.map(async (imageToLoad) => {
                if (imageToLoad.tracker !== undefined || !api) {
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
            })
        );
    }
);

export const loadRemoteDirectFromURL = createAction<LoadRemoteFromURLParams>('messages/remote/load/direct/url');

export const failedRemoteDirectLoading = createAction<{ ID: string; image: MessageRemoteImage }>(
    'messages/remote/failed/load/direct/url'
);

export const loadFakeTrackers = createAction<{ ID: string }>('message/trackers/fake/load');
