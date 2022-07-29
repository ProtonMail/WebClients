import { useDispatch } from 'react-redux';

import { c } from 'ttag';

import { useEventManager, useHandler, useMailSettings, useNotifications } from '@proton/components';
import { Abortable } from '@proton/components/hooks/useHandler';

import SendingMessageNotification, {
    SendingMessageNotificationManager,
    createSendingMessageNotificationManager,
} from '../../components/notifications/SendingMessageNotification';
import { MESSAGE_ALREADY_SENT_INTERNAL_ERROR, SAVE_DRAFT_ERROR_CODES, SEND_EMAIL_ERROR_CODES } from '../../constants';
import { useOnCompose } from '../../containers/ComposeProvider';
import { endSending, startSending } from '../../logic/messages/draft/messagesDraftActions';
import { MessageState, MessageStateWithData } from '../../logic/messages/messagesTypes';
import { MapSendInfo } from '../../models/crypto';
import { useGetMessage } from '../message/useMessage';
import { PromiseHandlers } from '../usePromise';
import { useSendMessage } from './useSendMessage';
import { useSendVerifications } from './useSendVerifications';

export interface UseSendHandlerParameters {
    // Composer will be unmounted and modelMessage will continue changing after sending start
    getModelMessage: () => MessageState;
    ensureMessageContent: () => void;
    mapSendInfo: MapSendInfo;
    promiseUpload: Promise<void>;
    pendingSave: PromiseHandlers<void>;
    pendingAutoSave: PromiseHandlers<void>;
    autoSave: ((message: MessageState) => Promise<void>) & Abortable;
    saveNow: (message: MessageState) => Promise<void>;
    onClose: () => void;
    onMessageAlreadySent: () => void;
    handleNoRecipients?: () => void;
    handleNoSubjects?: () => void;
    handleNoAttachments?: (keyword: string) => void;
}

export const useSendHandler = ({
    getModelMessage,
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
}: UseSendHandlerParameters) => {
    const { createNotification, hideNotification } = useNotifications();
    const { call } = useEventManager();
    const dispatch = useDispatch();
    const getMessage = useGetMessage();

    const { preliminaryVerifications, extendedVerifications } = useSendVerifications(
        handleNoRecipients,
        handleNoSubjects,
        handleNoAttachments
    );
    const sendMessage = useSendMessage();
    const [mailSettings] = useMailSettings();

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
                !verificationResults.hasChanged;

            // Don't abort before pendingAutoSave is checked
            autoSave.abort?.();

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
            onCompose({ existingDraft: getModelMessage(), fromUndo: true });
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

    const handleSend = useHandler(async () => {
        const { localID, draftFlags } = getModelMessage();
        const { scheduledAt } = draftFlags || {};
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
            text: (
                <SendingMessageNotification
                    scheduledAt={scheduledAt}
                    manager={notifManager}
                    viewMode={mailSettings?.ViewMode || 0}
                    message={getModelMessage().data}
                />
            ),
            expiration: -1,
            disableAutoClose: true,
        });

        ensureMessageContent();

        try {
            dispatch(startSending(localID));

            // Closing the composer instantly, all the send process will be in background
            onClose();

            try {
                await promiseUpload;
            } catch (error: any) {
                hideNotification(notifManager.ID);
                createNotification({
                    text: c('Error').t`Error while uploading attachments. Message is not sent.`,
                    type: 'error',
                });
                console.error('Error while uploading attachments.', error);
                onCompose({ existingDraft: getModelMessage(), fromUndo: true });
                throw error;
            }

            // Split handlers to have the updated version of the message
            await handleSendAfterUploads(notifManager);
        } finally {
            const asyncFinally = async () => {
                // Receive all updates about the current message before "releasing" it to prevent any flickering
                await call();
                // Whatever happens once the composer is closed, the sending flag is reset when finished
                dispatch(endSending(localID));
            };
            void asyncFinally();
        }
    });

    return handleSend;
};
