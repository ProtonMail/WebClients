import { c } from 'ttag';
import { useEventManager, useHandler, useMailSettings, useNotifications } from '@proton/components';
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
import { updateMessageCache, useMessageCache } from '../../containers/MessageProvider';
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
    saveNow: (message: MessageExtended) => Promise<void>;
    onClose: () => void;
    onMessageAlreadySent: () => void;
    handleNoRecipients?: () => void;
    handleNoSubjects?: () => void;
    handleNoAttachments?: (keyword: string) => void;
}

export const useSendHandler = ({
    modelMessage,
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

    const { preliminaryVerifications, extendedVerifications } = useSendVerifications(
        handleNoRecipients,
        handleNoSubjects,
        handleNoAttachments
    );
    const sendMessage = useSendMessage();
    const [mailSettings] = useMailSettings();

    const onCompose = useOnCompose();

    const messageCache = useMessageCache();

    const handleSendAfterUploads = useHandler(async (notifManager: SendingMessageNotificationManager) => {
        let verificationResults;
        let inputMessage;
        let mapSendPrefs;
        let alreadySaved;

        try {
            await pendingSave.promise; // Wait for potential ongoing save request

            verificationResults = await extendedVerifications(modelMessage as MessageExtendedWithData, mapSendInfo);
            mapSendPrefs = verificationResults.mapSendPrefs;

            const messageFromCache = messageCache.get(modelMessage.localID);
            alreadySaved =
                !!messageFromCache?.data?.ID && !pendingAutoSave.isPending && !verificationResults.hasChanged;
            autoSave.abort?.(); // Save will take place in the send process
            inputMessage = alreadySaved
                ? (messageFromCache as MessageExtendedWithData)
                : verificationResults.cleanMessage;

            // sendMessage expect a saved and up to date message
            // If there is anything new or pending, we have to make a last save
            if (!alreadySaved) {
                await saveNow(inputMessage);
                await call();
            }
        } catch (error) {
            hideNotification(notifManager.ID);
            onCompose({ existingDraft: modelMessage, fromUndo: true });
            throw error;
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
        const { localID, scheduledAt } = modelMessage;
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
                    localID={localID}
                    messageCache={messageCache}
                    viewMode={mailSettings?.ViewMode || 0}
                />
            ),
            expiration: -1,
            disableAutoClose: true,
        });

        ensureMessageContent();

        try {
            updateMessageCache(messageCache, localID, { sending: true });

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
                onCompose({ existingDraft: modelMessage, fromUndo: true });
                throw error;
            }

            // Split handlers to have the updated version of the message
            await handleSendAfterUploads(notifManager);
        } finally {
            const asyncFinally = async () => {
                // Receive all updates about the current message before "releasing" it to prevent any flickering
                await call();
                // Whatever happens once the composer is closed, the sending flag is reset when finished
                updateMessageCache(messageCache, localID, { sending: false });
            };
            void asyncFinally();
        }
    });

    return handleSend;
};
