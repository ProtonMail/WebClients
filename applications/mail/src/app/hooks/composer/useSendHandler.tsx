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
import { useSendVerifications } from './useSendVerifications';
import { useOnCompose } from '../../containers/ComposeProvider';
import { MapSendInfo } from '../../models/crypto';

export interface UseSendHandlerParameters {
    modelMessage: MessageExtended;
    ensureMessageContent: () => void;
    mapSendInfo: MapSendInfo;
    promiseUpload: Promise<void>;
    pendingSave: RefObject<boolean>;
    autoSave: ((message: MessageExtended) => Promise<void>) & Abortable;
    addAction: <T>(action: MessageAction<T>) => Promise<T>;
    onClose: () => void;
}

export const useSendHandler = ({
    modelMessage,
    ensureMessageContent,
    mapSendInfo,
    promiseUpload,
    pendingSave,
    autoSave,
    addAction,
    onClose,
}: UseSendHandlerParameters) => {
    const { createNotification, hideNotification } = useNotifications();

    const { preliminaryVerifications, extendedVerifications } = useSendVerifications();
    const sendMessage = useSendMessage();

    const onCompose = useOnCompose();

    const handleSendAfterUploads = useHandler(async (notifManager: SendingMessageNotificationManager) => {
        let verificationResults;
        try {
            verificationResults = await extendedVerifications(modelMessage as MessageExtendedWithData, mapSendInfo);
        } catch {
            hideNotification(notifManager.ID);
            onCompose({ existingDraft: modelMessage, fromUndo: true });
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

        await preliminaryVerifications(modelMessage as MessageExtendedWithData);

        // Display growler to receive direct feedback (UX) since sendMessage function is added to queue (and other async process could need to complete first)
        notifManager.ID = createNotification({
            text: <SendingMessageNotification manager={notifManager} />,
            expiration: -1,
            disableAutoClose: true,
        });

        ensureMessageContent();

        // Closing the composer instantly, all the send process will be in background
        onClose();

        try {
            await promiseUpload;
        } catch (error) {
            hideNotification(notifManager.ID);
            createNotification({
                text: c('Error').t`Error while uploading attachments. Message is not sent`,
                type: 'error',
            });
            console.error('Error while uploading attachments.', error);
            onCompose({ existingDraft: modelMessage, fromUndo: true });
            return;
        }

        // Split handlers to have the updated version of the message
        await handleSendAfterUploads(notifManager);
    });

    return handleSend;
};
