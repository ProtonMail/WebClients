import { getImage } from '@proton/shared/lib/api/images';
import { getMessage } from '@proton/shared/lib/api/messages';
import { wait } from '@proton/shared/lib/helpers/promise';
import { Message, Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { createAction, createAsyncThunk } from '@reduxjs/toolkit';
import { LOAD_RETRY_DELAY } from '../../constants';
import { get } from '../../helpers/attachment/attachmentLoader';
import { createBlob } from '../../helpers/message/messageEmbeddeds';
import { preloadImage } from '../../helpers/message/messageRemotes';
import { MessageEvent } from '../../models/event';
import { RootState } from '../store';
import { messageByID } from './messagesSelectors';
import {
    DocumentInitializeParams,
    LoadEmbeddedParams,
    LoadEmbeddedResults,
    LoadParams,
    LoadRemoteParams,
    LoadRemoteProxyResults,
    MessageEmbeddedImage,
    MessageRemoteImage,
    MessageState,
} from './messagesTypes';

export const initialize = createAction<MessageState>('messages/initialize');

export const event = createAction<MessageEvent>('messages/event');

export const load = createAsyncThunk<Message, LoadParams>('messages/load', async ({ ID, api }, { getState }) => {
    const messageFromCache = messageByID(getState() as RootState, { ID });

    // If the Body is already there, no need to send a request
    if (messageFromCache?.data && !messageFromCache?.data?.Body) {
        try {
            const { Message: message } = await api(getMessage(messageFromCache.data?.ID));
            // const loadRetry = (messageCache.get(localID)?.loadRetry || 0) + 1;
            // updateMessageCache(messageCache, localID, { data: message as Message, loadRetry });
            return message;
        } catch (error: any) {
            // const loadRetry = (messageCache.get(localID)?.loadRetry || 0) + 1;
            // updateMessageCache(messageCache, localID, { loadRetry });
            await wait(LOAD_RETRY_DELAY);
            throw error;
        }
    }
});

export const documentInitializePending = createAction<string>('messages/document/initialize/pending');

export const documentInitializeFulfilled = createAction<DocumentInitializeParams>(
    'messages/document/initialize/fulfilled'
);

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

export const loadRemoteProxy = createAsyncThunk<LoadRemoteProxyResults[], LoadRemoteParams>(
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
                        tracker: response.headers.get('x-pm-tracker-provider') || undefined,
                    };
                } catch (error) {
                    return { image, error };
                }
            })
        );
    }
);

export const loadFakeProxy = createAsyncThunk<LoadRemoteProxyResults[], LoadRemoteParams>(
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

export const loadRemoteDirect = createAsyncThunk<[MessageRemoteImage, unknown][], LoadRemoteParams>(
    'messages/remote/load/direct',
    async ({ imagesToLoad }) => {
        return Promise.all(
            imagesToLoad.map(async (image): Promise<[MessageRemoteImage, unknown]> => {
                try {
                    await preloadImage(image.url as string);
                    return [image, undefined];
                } catch (error) {
                    return [image, error];
                }
            })
        );
    }
);

export const createDraft = createAction<MessageState>('message/draft/create');

export const openDraft = createAction<{ ID: string; fromUndo: boolean }>('messages/draft/open');

export const removeInitialAttachments = createAction<string>('messages/draft/removeInitialAttachments');

export const draftSaved = createAction<{ ID: string; message: Message }>('message/draft/saved');

export const startSending = createAction<string>('messages/send/start');

export const sendModifications =
    createAction<{ ID: string; attachments: Attachment[]; images: MessageEmbeddedImage[] }>(
        'messages/send/modifications'
    );

export const endUndo = createAction<string>('message/send/endUndo');

export const sent = createAction<Message>('message/send/sent');

export const endSending = createAction<string>('messages/send/end');

export const deleteDraft = createAction<string>('messages/deleteDraft');
