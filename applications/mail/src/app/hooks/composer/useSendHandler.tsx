import type { Dispatch, SetStateAction } from 'react';

import { c } from 'ttag';

import { useEventManager, useHandler, useNotifications } from '@proton/components';
import type { Cancellable } from '@proton/components/hooks/useHandler';
import { getOnlineStatus } from '@proton/components/hooks/useOnline';

import { useMailDispatch } from 'proton-mail/store/hooks';

import type { SendingMessageNotificationManager } from '../../components/notifications/SendingMessageNotification';
import SendingMessageNotification, {
    createSendingMessageNotificationManager,
} from '../../components/notifications/SendingMessageNotification';
import {
    MESSAGE_ALREADY_SENT_INTERNAL_ERROR,
    SAVE_DRAFT_ERROR_CODES,
    SEND_EMAIL_ERROR_CODES,
    STORAGE_QUOTA_EXCEEDED_INTERNAL_ERROR,
} from '../../constants';
import { useOnCompose } from '../../containers/ComposeProvider';
import type { MapSendInfo } from '../../models/crypto';
import { endSending, startSending } from '../../store/messages/draft/messagesDraftActions';
import type { MessageState, MessageStateWithData } from '../../store/messages/messagesTypes';
import { cancelScheduled } from '../../store/messages/scheduled/scheduledActions';
import { useGetMessage } from '../message/useMessage';
import type { PromiseHandlers } from '../usePromise';
import { ComposeTypes } from './useCompose';
import { useSendMessage } from './useSendMessage';
import { useSendVerifications } from './useSendVerifications';

export interface UseSendHandlerParameters {
    // Composer will be unmounted and modelMessage will continue changing after sending start
    getModelMessage: () => MessageState;
    setModelMessage: (message: MessageState) => void;
    ensureMessageContent: () => void;
    mapSendInfo: MapSendInfo;
    promiseUpload?: Promise<void>;
    pendingSave: PromiseHandlers<void>;
    pendingAutoSave: PromiseHandlers<void>;
    autoSave: ((message: MessageState) => Promise<void>) & Cancellable;
    saveNow: (message: MessageState) => Promise<void>;
    onClose: () => void;
    onMessageAlreadySent: () => void;
    handleNoRecipients?: () => void;
    handleNoSubjects?: () => void;
    handleNoAttachments?: (keyword: string) => void;
    handleNoReplyEmail?: (email: string) => void;
    setIsSending?: Dispatch<SetStateAction<boolean>>;
    isQuickReply?: boolean;
    hasNetworkError: boolean;
    onSendAssistantReport?: () => void;
}

export const useSendHandler = ({
    getModelMessage,
    setModelMessage,
    ensureMessageContent,
    mapSendInfo,
    promiseUpload,
    pendingSave,
    pendingAutoSave,
    autoSave,
    saveNow,
    onClose,
    onMessageAlreadySent,
    handleNoRecipients,
    handleNoSubjects,
    handleNoAttachments,
    handleNoReplyEmail,
    setIsSending,
    isQuickReply,
    hasNetworkError,
    onSendAssistantReport,
}: UseSendHandlerParameters) => {
    const { createNotification, hideNotification } = useNotifications();
    const { call } = useEventManager();
    const dispatch = useMailDispatch();
    const getMessage = useGetMessage();

    const { preliminaryVerifications, extendedVerifications } = useSendVerifications(
        handleNoRecipients,
        handleNoSubjects,
        handleNoAttachments,
        handleNoReplyEmail
    );
    const sendMessage = useSendMessage();

    const onCompose = useOnCompose();

    const handleSendAfterUploads = useHandler(async (notifManager: SendingMessageNotificationManager) => {
        let verificationResults;
        let inputMessage;
        let mapSendPrefs;
        let alreadySaved;

        try {
            await pendingSave.promise; // Wait for potential ongoing save request

            verificationResults = await extendedVerifications(getModelMessage() as MessageStateWithData, mapSendInfo);
            mapSendPrefs = verificationResults.mapSendPrefs;
            inputMessage = verificationResults.cleanMessage;

            alreadySaved =
                !!getMessage(inputMessage.localID)?.data?.ID &&
                !pendingAutoSave.isPending &&
                !verificationResults.hasChanged &&
                !hasNetworkError; // If the last save failed because of no internet connection, we want to force saving before sending

            // Don't abort before pendingAutoSave is checked
            autoSave.cancel?.();

            // sendMessage expect a saved and up to date message
            // If there is anything new or pending, we have to make a last save
            if (!alreadySaved) {
                await saveNow(inputMessage);
                await call();
            }

            // Document is frequently reset in the state, keeping the one from the model
            // Rest is more up to date in the state, several changes could have happen since capturing the model
            inputMessage = {
                ...getModelMessage(),
                data: (getMessage(inputMessage.localID) as MessageStateWithData).data,
            };
        } catch {
            hideNotification(notifManager.ID);
            onCompose({ type: ComposeTypes.existingDraft, existingDraft: getModelMessage(), fromUndo: true });
            return;
        }

        try {
            await sendMessage({
                inputMessage,
                mapSendPrefs,
                onCompose,
                alreadySaved,
                sendingMessageNotificationManager: notifManager,
                useSilentApi: true,
                sendingFrom: isQuickReply ? 'quick-reply' : 'composer',
            });
        } catch (error: any) {
            hideNotification(notifManager.ID);

            if (
                [SAVE_DRAFT_ERROR_CODES.MESSAGE_ALREADY_SENT, SEND_EMAIL_ERROR_CODES.MESSAGE_ALREADY_SENT].includes(
                    error.data?.Code
                )
            ) {
                onMessageAlreadySent();
                throw error;
            }

            if (error?.message === STORAGE_QUOTA_EXCEEDED_INTERNAL_ERROR) {
                createNotification({
                    type: 'error',
                    text: c('Error').t`Sending attachments is restricted until you meet your plan limits or upgrade.`,
                });
                throw error;
            }

            if (error.data?.Error) {
                createNotification({
                    text: error.data?.Error,
                    type: 'error',
                });
                throw error;
            }

            createNotification({
                text: c('Error').t`Error while sending the message. Message is not sent.`,
                type: 'error',
            });
            console.error('Error while sending the message.', error);
            throw error;
        }
    });

    type HandleSendOptions = {
        /**
         * If true will send message with its scheduled flag if there's one
         * If false will reset message scheduled flag then send it
         */
        sendAsScheduled?: boolean;
    };
    const handleSend = useHandler(({ sendAsScheduled = false }: HandleSendOptions = {}) => async () => {
        const { localID, draftFlags } = getModelMessage();

        const scheduledAt = (() => {
            if (!draftFlags?.scheduledAt) {
                return undefined;
            }

            if (sendAsScheduled) {
                return draftFlags.scheduledAt;
            } else {
                dispatch(cancelScheduled({ ID: localID }));
                const modelMsg = getModelMessage();
                setModelMessage({
                    ...modelMsg,
                    draftFlags: {
                        ...modelMsg.draftFlags,
                        scheduledAt: undefined,
                    },
                });
                return undefined;
            }
        })();

        const notifManager = createSendingMessageNotificationManager();

        // If scheduledAt is set we already performed the preliminary verifications
        if (!scheduledAt) {
            try {
                await preliminaryVerifications(getModelMessage() as MessageStateWithData);
            } catch (error: any) {
                if (error?.message === MESSAGE_ALREADY_SENT_INTERNAL_ERROR) {
                    onMessageAlreadySent();
                }
                throw error;
            }
        }

        // Display growler to receive direct feedback (UX) since sendMessage function is added to queue (and other async process could need to complete first)
        notifManager.ID = createNotification({
            text: <SendingMessageNotification scheduledAt={scheduledAt} manager={notifManager} />,
            expiration: -1,
            showCloseButton: false,
        });

        ensureMessageContent();

        try {
            setIsSending?.(true);
            dispatch(startSending(localID));

            onSendAssistantReport?.();

            // If the user has no internet connection, do not close the composer on send, or we will lose last updates made on the draft
            const isOnline = getOnlineStatus();

            // Closing the composer instantly, all the send process will be in background
            // In quick reply however, we want to keep the editor opened while saving
            if (!isQuickReply && isOnline) {
                onClose();
            }

            try {
                await promiseUpload;
            } catch (error: any) {
                if (error?.message !== STORAGE_QUOTA_EXCEEDED_INTERNAL_ERROR) {
                    hideNotification(notifManager.ID);
                    createNotification({
                        text: c('Error').t`Error while uploading attachments. Message is not sent.`,
                        type: 'error',
                    });
                    console.error('Error while uploading attachments.', error);
                    onCompose({ type: ComposeTypes.existingDraft, existingDraft: getModelMessage(), fromUndo: true });
                    throw error;
                }
            }

            // Split handlers to have the updated version of the message
            await handleSendAfterUploads(notifManager);
        } finally {
            const asyncFinally = async () => {
                // Receive all updates about the current message before "releasing" it to prevent any flickering
                await call();
                // Whatever happens once the composer is closed, the sending flag is reset when finished
                dispatch(endSending(localID));

                setIsSending?.(false);
                // If quick reply we can close the editor
                if (isQuickReply) {
                    onClose();
                }
            };
            void asyncFinally();
        }
    });

    return handleSend;
};
