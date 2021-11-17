import { useDispatch } from 'react-redux';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { useCallback } from 'react';
import { useApi, useEventManager, useFolders, useMailSettings, useNotifications } from '@proton/components';
import { deleteMessages } from '@proton/shared/lib/api/messages';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { MAILBOX_LABEL_IDS, SHOW_MOVED } from '@proton/shared/lib/constants';
import { c } from 'ttag';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { MessageExtended, MessageExtendedWithData } from '../../models/message';
import { useGetMessageKeys } from './useGetMessageKeys';
import { mergeMessages } from '../../helpers/message/messages';
import { useMessageCache, updateMessageCache } from '../../containers/MessageProvider';
import { createMessage, updateMessage } from '../../helpers/message/messageExport';
import { replaceEmbeddedAttachments } from '../../helpers/message/messageEmbeddeds';
import { SAVE_DRAFT_ERROR_CODES } from '../../constants';
import { isNetworkError } from '../../helpers/errors';
import { getCurrentFolderID } from '../../helpers/labels';
import { deleteConversation } from '../../logic/conversations/conversationsActions';
import { useGetConversation } from '../conversation/useConversation';

const { ALL_DRAFTS } = MAILBOX_LABEL_IDS;

/**
 * Only takes technical stuff from the updated message
 */
export const mergeSavedMessage = (messageSaved: Message, messageReturned: Message): Message => ({
    ...messageSaved,
    ID: messageReturned.ID,
    Time: messageReturned.Time,
    ConversationID: messageReturned.ConversationID,
    LabelIDs: messageReturned.LabelIDs,
});

export const useCreateDraft = () => {
    const api = useApi();
    const messageCache = useMessageCache();
    const { call } = useEventManager();
    const getMessageKeys = useGetMessageKeys();

    return useCallback(async (message: MessageExtendedWithData) => {
        const messageKeys = await getMessageKeys(message.data);
        const newMessage = await createMessage(message, api, getMessageKeys);
        const messageImages = replaceEmbeddedAttachments(message, newMessage.Attachments);
        updateMessageCache(messageCache, message.localID, {
            data: {
                ...mergeSavedMessage(message.data, newMessage),
                Attachments: newMessage.Attachments,
                Subject: newMessage.Subject,
            },
            ...messageKeys,
            document: message.document,
            plainText: message.plainText,
            messageImages,
        });
        await call();
    }, []);
};

const useUpdateDraft = () => {
    const api = useApi();
    const messageCache = useMessageCache();
    const { call } = useEventManager();
    const getMessageKeys = useGetMessageKeys();
    const { createNotification } = useNotifications();

    return useCallback(async (message: MessageExtendedWithData, onMessageAlreadySent?: () => void) => {
        try {
            const messageFromCache = messageCache.get(message.localID) as MessageExtended;
            const previousAddressID = messageFromCache.data?.AddressID || '';
            const newMessageKeys = await getMessageKeys(message.data);
            const messageToSave = mergeMessages(messageFromCache, message) as MessageExtendedWithData;
            const newMessage = await updateMessage(messageToSave, previousAddressID, api, getMessageKeys);
            updateMessageCache(messageCache, message.localID, {
                ...newMessageKeys,
                data: {
                    ...mergeSavedMessage(message.data, newMessage),
                    // If sender has changed, attachments are re-encrypted and then have to be updated
                    Attachments: newMessage.Attachments,
                },
                document: message.document,
                plainText: message.plainText,
                messageImages: message.messageImages,
            });
            await call();
        } catch (error: any) {
            if (!error.data) {
                const errorMessage = c('Error').t`Error while saving draft. Please try again.`;
                createNotification({ text: errorMessage, type: 'error' });
                if (!isNetworkError(error)) {
                    captureMessage(errorMessage, { extra: { message, error } });
                }
                throw error;
            }

            if (error.data.Code === SAVE_DRAFT_ERROR_CODES.MESSAGE_ALREADY_SENT) {
                onMessageAlreadySent?.();
                throw error;
            }

            if (error.data.Code === SAVE_DRAFT_ERROR_CODES.DRAFT_DOES_NOT_EXIST) {
                messageCache.delete(message.localID);
            }

            createNotification({
                text: error.data.Error,
                type: 'error',
            });
            throw error;
        }
    }, []);
};

interface UseUpdateDraftParameters {
    onMessageAlreadySent?: () => void;
}

export const useSaveDraft = ({ onMessageAlreadySent }: UseUpdateDraftParameters = {}) => {
    const messageCache = useMessageCache();
    const updateDraft = useUpdateDraft();
    const createDraft = useCreateDraft();

    return useCallback(async (message: MessageExtendedWithData) => {
        const messageFromCache = messageCache.get(message.localID) as MessageExtended;

        if (messageFromCache?.data?.ID) {
            await updateDraft(message, onMessageAlreadySent);
        } else {
            await createDraft(message);
        }
    }, []);
};

export const useDeleteDraft = () => {
    const api = useApi();
    const [mailSettings] = useMailSettings();
    const [folders = []] = useFolders();
    const dispatch = useDispatch();
    const messageCache = useMessageCache();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const getConversation = useGetConversation();

    return useCallback(
        async (message: MessageExtended) => {
            const showMoved = hasBit(mailSettings?.ShowMoved || 0, SHOW_MOVED.DRAFTS);
            const currentLabelID = showMoved ? ALL_DRAFTS : getCurrentFolderID(message.data?.LabelIDs, folders);
            const response: any = await api(deleteMessages([message.data?.ID], currentLabelID));

            // For the "Please refresh your page, the message has moved."
            // Backend is not replying with an HTTP error but with an error inside the Response
            // (it's to deal about potentially different statuses in several deletions)
            if (response?.Responses?.[0]?.Response?.Error) {
                const { Response } = response.Responses[0];
                createNotification({ text: Response.Error, type: 'error' });
                const error = new Error(Response.Error);
                (error as any).code = Response.Code;
                throw error;
            }

            messageCache.delete(message.localID || '');

            const conversationID = message.data?.ConversationID || '';
            const conversationFromConversationState = getConversation(conversationID);
            if (conversationFromConversationState && conversationFromConversationState.Messages?.length === 1) {
                dispatch(deleteConversation(conversationID));
            }

            await call();
        },
        [api, messageCache, mailSettings]
    );
};
