import { useCallback } from 'react';

import { c } from 'ttag';

import { useApi, useEventManager, useNotifications } from '@proton/components';
import type { MessageState, MessageStateWithData } from '@proton/mail/store/messages/messagesTypes';
import { deleteMessages } from '@proton/shared/lib/api/messages';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';

import useMailModel from 'proton-mail/hooks/useMailModel';
import { useMailDispatch } from 'proton-mail/store/hooks';

import { SAVE_DRAFT_ERROR_CODES } from '../../constants';
import { isDecryptionError, isNetworkError, pickMessageInfosForSentry } from '../../helpers/errors';
import { createMessage, updateMessage } from '../../helpers/message/messageExport';
import { deleteConversation } from '../../store/conversations/conversationsActions';
import { deleteDraft, draftSaved } from '../../store/messages/draft/messagesDraftActions';
import { useGetConversation } from '../conversation/useConversation';
import { useGetMessageKeys } from './useGetMessageKeys';
import { useGetMessage } from './useMessage';

export const useCreateDraft = () => {
    const api = useApi();
    const dispatch = useMailDispatch();
    const { call } = useEventManager();
    const getMessageKeys = useGetMessageKeys();
    const { createNotification } = useNotifications();

    return useCallback(async (message: MessageStateWithData) => {
        try {
            const newMessage = await createMessage(message, api, getMessageKeys);
            dispatch(draftSaved({ ID: message.localID, message: newMessage, draftFlags: message?.draftFlags }));
            await call();
        } catch (error: any) {
            if (!error.data) {
                createNotification({ text: c('Error').t`Error while saving draft. Please try again.`, type: 'error' });
            }
            throw error;
        }
    }, []);
};

const useUpdateDraft = () => {
    const api = useApi();
    const dispatch = useMailDispatch();
    const getMessage = useGetMessage();
    const { call } = useEventManager();
    const getMessageKeys = useGetMessageKeys();
    const { createNotification } = useNotifications();

    return useCallback(async (message: MessageStateWithData, onMessageAlreadySent?: () => void) => {
        try {
            const messageFromCache = getMessage(message.localID) as MessageState;
            const previousAddressID = messageFromCache.data?.AddressID || '';
            const messageToSave = {
                ...messageFromCache,
                ...message,
                data: { ...messageFromCache.data, ...message.data },
            };
            const newMessage = await updateMessage(messageToSave, previousAddressID, api, getMessageKeys);
            dispatch(draftSaved({ ID: message.localID, message: newMessage }));
            await call();
        } catch (error: any) {
            if (!error.data) {
                const errorMessage = c('Error').t`Error while saving draft. Please try again.`;
                createNotification({ text: errorMessage, type: 'error' });
                if (!isNetworkError(error) && !isDecryptionError(error)) {
                    captureMessage(errorMessage, { extra: { message: pickMessageInfosForSentry(message), error } });
                }
                throw error;
            }

            if (error.data.Code === SAVE_DRAFT_ERROR_CODES.MESSAGE_ALREADY_SENT) {
                onMessageAlreadySent?.();
                throw error;
            }

            if (error.data.Code === SAVE_DRAFT_ERROR_CODES.DRAFT_DOES_NOT_EXIST) {
                dispatch(deleteDraft(message.localID));
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
    const getMessage = useGetMessage();
    const updateDraft = useUpdateDraft();
    const createDraft = useCreateDraft();

    return useCallback(async (message: MessageStateWithData) => {
        const messageFromCache = getMessage(message.localID) as MessageState;

        if (messageFromCache?.data?.ID) {
            await updateDraft(message, onMessageAlreadySent);
        } else {
            await createDraft(message);
        }
    }, []);
};

export const useDeleteDraft = () => {
    const api = useApi();
    const mailSettings = useMailModel('MailSettings');
    const dispatch = useMailDispatch();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const getConversation = useGetConversation();
    const getMessage = useGetMessage();

    return useCallback(
        async (message: MessageState) => {
            // Need to get again the message from state because if we are saving the draft for the first time,
            // it might have been saved in the meantime.
            // So the old reference would not be up to date, and we would not be able to delete the message
            const messageFromState = getMessage(message.localID);
            const messageID = messageFromState?.data?.ID;

            if (!messageID) {
                return;
            }
            const response: any = await api(deleteMessages([messageID], MAILBOX_LABEL_IDS.ALL_DRAFTS));

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

            dispatch(deleteDraft(message.data?.ID || message.localID));

            const conversationID = message.data?.ConversationID || '';
            const conversationFromConversationState = getConversation(conversationID);
            if (conversationFromConversationState && conversationFromConversationState.Messages?.length === 1) {
                dispatch(deleteConversation(conversationID));
            }

            await call();
        },
        [api, mailSettings]
    );
};
