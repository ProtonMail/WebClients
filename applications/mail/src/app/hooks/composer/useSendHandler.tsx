import React, { RefObject } from 'react';
import { c } from 'ttag';
import { useHandler, useNotifications } from 'react-components';
import { Abortable } from 'react-components/hooks/useHandler';
import SendingMessageNotification, {
    createSendingMessageNotificationManager,
    SendingMessageNotificationManager,
} from '../../components/notifications/SendingMessageNotification';
import { MessageAction, MessageExtended, MessageExtendedWithData } from '../../models/message';
import { useSendMessage } from './useSendMessage';
import { OnCompose } from './useCompose';
import { useSendVerifications } from './useSendVerifications';

export interface UseSendHandlerParameters {
    modelMessage: MessageExtended;
    ensureMessageContent: () => void;
    promiseUpload: Promise<void>;
    pendingSave: RefObject<boolean>;
    autoSave: ((message: MessageExtended) => Promise<void>) & Abortable;
    addAction: <T>(action: MessageAction<T>) => Promise<T>;
    onCompose: OnCompose;
    onClose: () => void;
}

export const useSendHandler = ({
    modelMessage,
    ensureMessageContent,
    promiseUpload,
    pendingSave,
    autoSave,
    addAction,
    onCompose,
    onClose,
}: UseSendHandlerParameters) => {
    const { createNotification, hideNotification } = useNotifications();

    const sendVerifications = useSendVerifications();
    const sendMessage = useSendMessage();

    const handleSendAfterUploads = useHandler(async (notifManager: SendingMessageNotificationManager) => {
        let verificationResults;
        try {
            verificationResults = await sendVerifications(modelMessage as MessageExtendedWithData);
        } catch {
            hideNotification(notifManager.ID);
            onCompose({ existingDraft: modelMessage });
            return;
        }

        const { cleanMessage, mapSendPrefs, hasChanged } = verificationResults;
        const alreadySaved = !!cleanMessage.data.ID && !pendingSave.current && !hasChanged;
        autoSave.abort?.();

        await addAction(async () => {
            try {
                await sendMessage(cleanMessage, mapSendPrefs, onCompose, alreadySaved, notifManager);
            } catch (error) {
                hideNotification(notifManager.ID);
                createNotification({
                    text: c('Error').t`Error while sending the message. Message is not sent`,
                    type: 'error',
                });
                console.error('Error while sending the message.', error);
                throw error;
            }
        });
    });

    const handleSend = useHandler(async () => {
        const notifManager = createSendingMessageNotificationManager();

        // Display growler to receive direct feedback (UX) since sendMessage function is added to queue (and other async process could need to complete first)
        notifManager.ID = createNotification({
            text: <SendingMessageNotification manager={notifManager} />,
            expiration: -1,
            disableAutoClose: true,
        });

        // Closing the composer instantly, all the send process will be in background
        onClose();

        ensureMessageContent();

        try {
            await promiseUpload;
        } catch (error) {
            hideNotification(notifManager.ID);
            createNotification({
                text: c('Error').t`Error while uploading attachments. Message is not sent`,
                type: 'error',
            });
            console.error('Error while uploading attachments.', error);
            onCompose({ existingDraft: modelMessage });
            return;
        }

        // Split handlers to have the updated version of the message
        await handleSendAfterUploads(notifManager);
    });

    return handleSend;
};
