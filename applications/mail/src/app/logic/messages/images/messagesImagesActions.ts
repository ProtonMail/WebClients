import { getImage } from '@proton/shared/lib/api/images';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { get } from '../../../helpers/attachment/attachmentLoader';
import { preloadImage } from '../../../helpers/dom';
import { createBlob } from '../../../helpers/message/messageEmbeddeds';
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
                    getAttachment,
                    onUpdateAttachment,
                    api
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
                    const response: Response = await api({
                        ...getImage(image.url as string),
                        output: 'raw',
                        silence: true,
                    });

                    return {
                        image,
                        blob: await response.blob(),
                        // Warning: in local dev it will not work due to CORS limitations
                        // https://stackoverflow.com/questions/43344819/reading-response-headers-with-fetch-api#44816592
                        tracker: response.headers.get('x-pm-tracker-provider') || undefined,
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
                        const response: Response = await api({
                            ...getImage(image.url as string, 1),
                            output: 'raw',
                            silence: true,
                        });

                        return {
                            image,
                            tracker: response.headers.get('x-pm-tracker-provider') || undefined,
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
                    await preloadImage(image.url as string);
                    return { image };
                } catch (error) {
                    return { image, error };
                }
            })
        );
    }
);
