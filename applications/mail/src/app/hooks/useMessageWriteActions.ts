import { useCallback } from 'react';
import { useApi, useEventManager } from 'react-components';
import { deleteMessages } from 'proton-shared/lib/api/messages';

import { MessageExtended, Message, MessageExtendedWithData } from '../models/message';
import { useMessageKeys } from './useMessageKeys';
import { mergeMessages } from '../helpers/message/messages';
import { useMessageCache, updateMessageCache, updateMessageStatus, MessageCache } from '../containers/MessageProvider';
import { createMessage, updateMessage } from '../helpers/message/messageExport';

/**
 * Only takes technical stuff from the updated message
 */
export const mergeSavedMessage = (messageSaved: Message, messageReturned: Message): Message => ({
    ...messageSaved,
    ID: messageReturned.ID,
    Time: messageReturned.Time,
    ConversationID: messageReturned.ConversationID
});

const getUpdateStatus = (messageCache: MessageCache, localID: string) => (status: string) =>
    updateMessageStatus(messageCache, localID, status);

export const useCreateDraft = () => {
    const api = useApi();
    const messageCache = useMessageCache();
    const { call } = useEventManager();
    const getMessageKeys = useMessageKeys();

    return useCallback(async (message: MessageExtendedWithData) => {
        const messageKeys = await getMessageKeys(message);
        const newMessage = await createMessage(
            { ...message, ...messageKeys },
            api,
            getUpdateStatus(messageCache, message.localID)
        );
        updateMessageCache(messageCache, message.localID, {
            data: mergeSavedMessage(message.data, newMessage),
            ...messageKeys
        });
        await call();
    }, []);
};

export const useSaveDraft = () => {
    const api = useApi();
    const messageCache = useMessageCache();
    const { call } = useEventManager();
    const getMessageKeys = useMessageKeys();

    return useCallback(async (message: MessageExtendedWithData) => {
        const messageFromCache = messageCache.get(message.localID) as MessageExtended;
        const senderHasChanged = messageFromCache.data?.Sender.Address !== message.data?.Sender.Address;
        const messageKeys = await getMessageKeys(message, senderHasChanged);
        const messageToSave = mergeMessages(messageFromCache, { ...message, ...messageKeys });
        const newMessage = await updateMessage(
            messageToSave,
            senderHasChanged,
            api,
            getUpdateStatus(messageCache, message.localID)
        );
        updateMessageCache(messageCache, message.localID, {
            ...messageKeys,
            data: mergeSavedMessage(message.data, newMessage)
        });
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
