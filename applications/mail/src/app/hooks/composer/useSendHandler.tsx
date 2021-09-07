import { c } from 'ttag';
import { useHandler, useMailSettings, useNotifications } from '@proton/components';
import { Abortable } from '@proton/components/hooks/useHandler';
import SendingMessageNotification, {
    createSendingMessageNotificationManager,
    SendingMessageNotificationManager,
} from '../../components/notifications/SendingMessageNotification';
import { MessageExtended, MessageExtendedWithData } from '../../models/message';
import { useSendMessage } from './useSendMessage';
import { useSendVerifications } from './useSendVerifications';
import { useOnCompose } from '../../containers/ComposeProvider';
import { MapSendInfo } from '../../models/crypto';
import { useMessageCache } from '../../containers/MessageProvider';
import { SAVE_DRAFT_ERROR_CODES, SEND_EMAIL_ERROR_CODES, MESSAGE_ALREADY_SENT_INTERNAL_ERROR } from '../../constants';
import { PromiseHandlers } from '../usePromise';

export interface UseSendHandlerParameters {
    modelMessage: MessageExtended;
    ensureMessageContent: () => void;
    mapSendInfo: MapSendInfo;
    promiseUpload: Promise<void>;
    pendingSave: PromiseHandlers<void>;
    pendingAutoSave: PromiseHandlers<void>;
    autoSave: ((message: MessageExtended) => Promise<void>) & Abortable;
    onClose: () => void;
    onMessageAlreadySent: () => void;
}

export const useSendHandler = ({
    modelMessage,
    ensureMessageContent,
    mapSendInfo,
    promiseUpload,
    pendingSave,
    pendingAutoSave,
    autoSave,
    onClose,
    onMessageAlreadySent,
}: UseSendHandlerParameters) => {
    const { createNotification, hideNotification } = useNotifications();

    const { preliminaryVerifications, extendedVerifications } = useSendVerifications();
    const sendMessage = useSendMessage();
    const [mailSettings] = useMailSettings();

    const onCompose = useOnCompose();

    const messageCache = useMessageCache();

    const handleSendAfterUploads = useHandler(async (notifManager: SendingMessageNotificationManager) => {
        await pendingSave.promise; // Wait for potential ongoing save request

        let verificationResults;
        try {
            verificationResults = await extendedVerifications(modelMessage as MessageExtendedWithData, mapSendInfo);
        } catch {
            hideNotification(notifManager.ID);
            onCompose({ existingDraft: modelMessage, fromUndo: true });
            return;
        }

        const messageFromCache = messageCache.get(modelMessage.localID);
        const { cleanMessage, mapSendPrefs, hasChanged } = verificationResults;
        const alreadySaved = !!messageFromCache?.data?.ID && !pendingAutoSave.isPending && !hasChanged;
        autoSave.abort?.(); // Save will take place in the send process
        const inputMessage = alreadySaved ? (messageFromCache as MessageExtendedWithData) : cleanMessage;

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

            createNotification({
                text: c('Error').t`Error while sending the message. Message is not sent`,
                type: 'error',
            });
            console.error('Error while sending the message.', error);
            throw error;
        }
    });

    const handleSend = useHandler(async () => {
        const { scheduledAt } = modelMessage;
        const notifManager = createSendingMessageNotificationManager();

        // If scheduledAt is set we already performed the preliminary verifications
        if (!scheduledAt) {
            try {
                await preliminaryVerifications(modelMessage as MessageExtendedWithData);
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
