import { RefObject } from 'react';
import { c } from 'ttag';
import { useHandler, useMailSettings, useNotifications } from '@proton/components';
import { Abortable } from '@proton/components/hooks/useHandler';
import SendingMessageNotification, {
    createSendingMessageNotificationManager,
    SendingMessageNotificationManager,
} from '../../components/notifications/SendingMessageNotification';
import { MessageAction, MessageExtended, MessageExtendedWithData } from '../../models/message';
import { useSendMessage } from './useSendMessage';
import { useSendVerifications } from './useSendVerifications';
import { useOnCompose } from '../../containers/ComposeProvider';
import { MapSendInfo } from '../../models/crypto';
import { useMessageCache } from '../../containers/MessageProvider';

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
    const [mailSettings] = useMailSettings();

    const onCompose = useOnCompose();

    const messageCache = useMessageCache();

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
        const { scheduledAt } = modelMessage;
        const notifManager = createSendingMessageNotificationManager();

        // If scheduledAt is set we already performed the preliminary verifications
        if (!scheduledAt) {
            await preliminaryVerifications(modelMessage as MessageExtendedWithData);
        }

        // Display growler to receive direct feedback (UX) since sendMessage function is added to queue (and other async process could need to complete first)
        notifManager.ID = createNotification({
            text: (
                <SendingMessageNotification
                    scheduledAt={scheduledAt}
                    manager={notifManager}
                    localID={modelMessage.localID}
                    messageCache={messageCache}
                    viewMode={mailSettings?.ViewMode || 0}
                />
            ),
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
