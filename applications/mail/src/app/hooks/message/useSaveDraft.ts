import { useCallback } from 'react';
import { useApi, useEventManager } from 'react-components';
import { deleteMessages } from 'proton-shared/lib/api/messages';

import { MessageExtended, Message, MessageExtendedWithData } from '../../models/message';
import { useMessageKeys } from './useMessageKeys';
import { mergeMessages } from '../../helpers/message/messages';
import { useMessageCache, updateMessageCache } from '../../containers/MessageProvider';
import { createMessage, updateMessage } from '../../helpers/message/messageExport';
import { createEquivalentEmbeddeds } from '../../helpers/embedded/embeddeds';

/**
 * Only takes technical stuff from the updated message
 */
export const mergeSavedMessage = (messageSaved: Message, messageReturned: Message): Message => ({
    ...messageSaved,
    ID: messageReturned.ID,
    Time: messageReturned.Time,
    ConversationID: messageReturned.ConversationID
});

export const useCreateDraft = () => {
    const api = useApi();
    const messageCache = useMessageCache();
    const { call } = useEventManager();
    const getMessageKeys = useMessageKeys();

    return useCallback(async (message: MessageExtendedWithData) => {
        const messageKeys = await getMessageKeys(message);
        const newMessage = await createMessage({ ...message, ...messageKeys }, api);
        updateMessageCache(messageCache, message.localID, {
            data: { ...mergeSavedMessage(message.data, newMessage), Attachments: newMessage.Attachments },
            ...messageKeys,
            embeddeds: createEquivalentEmbeddeds(message.embeddeds, newMessage.Attachments),
            document: message.document,
            plainText: message.plainText
        });
        await call();
    }, []);
};

const useUpdateDraft = () => {
    const api = useApi();
    const messageCache = useMessageCache();
    const { call } = useEventManager();
    const getMessageKeys = useMessageKeys();

    return useCallback(async (message: MessageExtendedWithData) => {
        const messageFromCache = messageCache.get(message.localID) as MessageExtended;
        const senderHasChanged = messageFromCache.data?.Sender.Address !== message.data?.Sender.Address;
        const newMessageKeys = await getMessageKeys(message);
        const previousMessageKeys = await getMessageKeys(messageFromCache as MessageExtendedWithData);
        const messageToSave = mergeMessages(messageFromCache, { ...message, ...newMessageKeys });
        const newMessage = await updateMessage(messageToSave, senderHasChanged, previousMessageKeys.privateKeys, api);
        updateMessageCache(messageCache, message.localID, {
            ...newMessageKeys,
            data: mergeSavedMessage(message.data, newMessage),
            document: message.document,
            plainText: message.plainText
        });
        await call();
    }, []);
};

export const useSaveDraft = () => {
    const messageCache = useMessageCache();
    const updateDraft = useUpdateDraft();
    const createDraft = useCreateDraft();

    return useCallback(async (message: MessageExtendedWithData) => {
        const messageFromCache = messageCache.get(message.localID) as MessageExtended;

        if (messageFromCache.data?.ID) {
            await updateDraft(message);
        } else {
            await createDraft(message);
        }
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
