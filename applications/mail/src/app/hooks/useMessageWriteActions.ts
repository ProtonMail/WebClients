import { useCallback } from 'react';
import { useApi, useEventManager } from 'react-components';

import { MessageExtended, Message } from '../models/message';
import { useMessageKeys } from './useMessageKeys';
import { getAttachments, mergeMessages } from '../helpers/message/messages';
import { useMessageCache, updateMessageCache, updateMessageStatus, MessageCache } from '../containers/MessageProvider';
import { createMessage, updateMessage } from '../helpers/message/messageExport';
import { deleteMessages } from 'proton-shared/lib/api/messages';
import { UploadResult, ATTACHMENT_ACTION } from '../helpers/attachment/attachmentUploader';
import { createEmbeddedMap, readCID, createBlob } from '../helpers/embedded/embeddeds';

/**
 * Only takes technical stuff from the updated message
 */
export const mergeSavedMessage = (messageSaved: Message = {}, messageReturned: Message): Message => ({
    ...messageSaved,
    ID: messageReturned.ID,
    Time: messageReturned.Time,
    ContextTime: messageReturned.ContextTime,
    ConversationID: messageReturned.ConversationID
});

const getUpdateStatus = (messageCache: MessageCache, localID: string) => (status: string) =>
    updateMessageStatus(messageCache, localID, status);

export const useCreateDraft = () => {
    const api = useApi();
    const messageCache = useMessageCache();
    const { call } = useEventManager();
    const getKeys = useMessageKeys();

    return useCallback(async (message: MessageExtended) => {
        const { publicKeys, privateKeys } = await getKeys(message);
        const newMessage = await createMessage(
            { ...message, publicKeys, privateKeys },
            api,
            getUpdateStatus(messageCache, message.localID)
        );
        updateMessageCache(messageCache, message.localID, {
            data: mergeSavedMessage(message.data, newMessage),
            publicKeys,
            privateKeys
        });
        await call();
    }, []);
};

export const useSaveDraft = () => {
    const api = useApi();
    const messageCache = useMessageCache();
    const { call } = useEventManager();

    return useCallback(async (message: MessageExtended) => {
        const messageFromCache = messageCache.get(message.localID) as MessageExtended;
        const messageToSave = mergeMessages(messageFromCache, message);
        const newMessage = await updateMessage(messageToSave, api, getUpdateStatus(messageCache, message.localID));
        updateMessageCache(messageCache, message.localID, { data: mergeSavedMessage(message.data, newMessage) });
        await call();
    }, []);
};

export const useDeleteDraft = (message: MessageExtended) => {
    const api = useApi();
    const messageCache = useMessageCache();
    const { call } = useEventManager();

    return useCallback(async () => {
        await api(deleteMessages([message.data?.ID]));
        messageCache.delete(message.localID || '');
        await call();
    }, [message]);
};

export const useUpdateAttachments = (message: MessageExtended) => {
    const messageCache = useMessageCache();

    return useCallback(
        async (uploads: UploadResult[], action = ATTACHMENT_ACTION.ATTACHMENT) => {
            // New attachment list
            const newAttachments = uploads.map((upload) => upload.attachment);
            const Attachments = [...getAttachments(message.data), ...newAttachments];

            // Update embeddeds map if embedded attachments
            const embeddeds = message.embeddeds || createEmbeddedMap();

            if (action === ATTACHMENT_ACTION.INLINE) {
                uploads.forEach((upload) =>
                    embeddeds.set(readCID(upload.attachment), {
                        attachment: upload.attachment,
                        url: createBlob(upload.attachment, upload.packets.Preview)
                    })
                );
            }

            return updateMessageCache(messageCache, message.localID, { data: { Attachments }, embeddeds });
        },
        [message]
    );
};
