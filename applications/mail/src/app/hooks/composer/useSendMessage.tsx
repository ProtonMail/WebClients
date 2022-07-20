import { useCallback } from 'react';
import { SendPreferences } from '@proton/shared/lib/interfaces/mail/crypto';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { getRecipientsAddresses } from '@proton/shared/lib/mail/messages';
import { useHistory } from 'react-router';
import { c } from 'ttag';
import unique from '@proton/utils/unique';
import { cancelSend } from '@proton/shared/lib/api/messages';
import { useApi, useEventManager, useNotifications } from '@proton/components';
import { wait } from '@proton/shared/lib/helpers/promise';
import { MIME_TYPES } from '@proton/shared/lib/constants';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { useDispatch } from 'react-redux';
import { WorkerDecryptionResult } from '@proton/crypto';
import { generateTopPackages } from '../../helpers/send/sendTopPackages';
import { attachSubPackages } from '../../helpers/send/sendSubPackages';
import { sendFormatter } from '../../helpers/send/sendFormatter';
import { encryptPackages } from '../../helpers/send/sendEncrypt';
import { SendingMessageNotificationManager } from '../../components/notifications/SendingMessageNotification';
import { OnCompose } from './useCompose';
import useDelaySendSeconds from '../useDelaySendSeconds';
import { useGetMessageKeys } from '../message/useGetMessageKeys';
import { getParamsFromPathname, setParamsInLocation } from '../../helpers/mailboxUrl';
import { useSendModifications } from './useSendModifications';
import { MIN_DELAY_SENT_NOTIFICATION, SAVE_DRAFT_ERROR_CODES, SEND_EMAIL_ERROR_CODES } from '../../constants';
import { updateAttachment } from '../../logic/attachments/attachmentsActions';
import { useGetAttachment } from '../useAttachment';
import { MessageStateWithData } from '../../logic/messages/messagesTypes';
import { useGetMessage } from '../message/useMessage';
import { cancelScheduled, endUndo, sent } from '../../logic/messages/draft/messagesDraftActions';
import LoadingNotificationContent from '../../components/notifications/LoadingNotificationContent';

// Reference: Angular/src/app/composer/services/sendMessage.js

interface UseSendMessageParameters {
    inputMessage: MessageStateWithData;
    mapSendPrefs: SimpleMap<SendPreferences>;
    onCompose: OnCompose;
    alreadySaved?: boolean;
    sendingMessageNotificationManager?: SendingMessageNotificationManager;
    useSilentApi?: boolean;
}

export const useSendMessage = () => {
    const api = useApi();
    const getMessageKeys = useGetMessageKeys();
    const getAttachment = useGetAttachment();
    const dispatch = useDispatch();
    const { call } = useEventManager();
    const getMessage = useGetMessage();
    const history = useHistory<any>();
    const delaySendSeconds = useDelaySendSeconds();
    const { createNotification, hideNotification } = useNotifications();
    const sendModification = useSendModifications();

    const onUpdateAttachment = (ID: string, attachment: WorkerDecryptionResult<Uint8Array>) => {
        dispatch(updateAttachment({ ID, attachment }));
    };

    return useCallback(
        async ({
            inputMessage,
            mapSendPrefs,
            onCompose,
            sendingMessageNotificationManager,
            useSilentApi = false,
        }: UseSendMessageParameters) => {
            const { localID, data } = inputMessage;
            const hasUndo = !!delaySendSeconds;

            const handleUndo = async () => {
                if (sendingMessageNotificationManager) {
                    hideNotification(sendingMessageNotificationManager.ID);
                }
                const savedMessage = getMessage(localID) as MessageStateWithData;
                const isScheduledMessage = savedMessage.draftFlags?.scheduledAt;
                const request = async () => {
                    if (isScheduledMessage) {
                        await dispatch(cancelScheduled(savedMessage.localID));
                        await api(cancelSend(savedMessage.data.ID));
                    } else {
                        await api(cancelSend(savedMessage.data.ID));
                    }
                    await call();
                };
                const promise = request();
                const undoingSendNotification = createNotification({
                    text: (
                        <LoadingNotificationContent
                            loadingText={c('Message notification').t`Undoing send...`}
                            loadedText={
                                isScheduledMessage
                                    ? c('Message notification').t`Scheduled sending undone`
                                    : c('Message notification').t`Sending undone`
                            }
                            promise={promise}
                        />
                    ),
                    expiration: -1,
                });
                const startTime = performance.now();
                try {
                    await promise;
                    const endTime = performance.now();
                    // Display the notification at least 1,5 second to let the user read it
                    setTimeout(
                        () => {
                            hideNotification(undoingSendNotification);
                        },
                        endTime - startTime > 2000 ? 0 : 1500
                    );
                } catch (error: any) {
                    hideNotification(undoingSendNotification);
                    throw error;
                }
                // Re-open draft
                onCompose({
                    existingDraft: {
                        localID,
                        data,
                    },
                    fromUndo: true,
                });
            };

            const prepareMessageToSend = async () => {
                const messageKeys = await getMessageKeys(inputMessage.data);

                // Last minute modifications on the message before sending
                const message = (await sendModification(inputMessage)) as MessageStateWithData;

                const emails = unique(getRecipientsAddresses(inputMessage.data));

                const hasHtml = Object.values(mapSendPrefs).some(
                    (sendPref) => sendPref?.mimeType === MIME_TYPES.DEFAULT
                );
                if (hasHtml && message.messageDocument?.document === undefined) {
                    const errorMessage = 'Sending with missing document error';
                    captureMessage(errorMessage, { extra: { message } });
                    throw new Error(errorMessage);
                }

                let packages = await generateTopPackages(
                    message,
                    messageKeys,
                    mapSendPrefs,
                    getAttachment,
                    onUpdateAttachment,
                    api
                );
                packages = await attachSubPackages(packages, message, emails, mapSendPrefs, api);
                packages = await encryptPackages(message, messageKeys, packages);

                // expiresIn is not saved on the API and then empty in `message`, we need to refer to `inputMessage`
                const { expiresIn, autoSaveContacts, scheduledAt } = inputMessage.draftFlags || {};

                const payload = sendFormatter({
                    ID: message.data?.ID,
                    packages,
                    expiresIn,
                    delaySendSeconds,
                    autoSaveContacts,
                    scheduledAt,
                });

                return api<{ Sent: Message }>({
                    ...payload,
                    silence: useSilentApi,
                    timeout: 60000,
                });
            };

            const promise = prepareMessageToSend().then((result) => {
                const now = Date.now();
                const delay = now + delaySendSeconds * 1000;
                const delta = delay - now;
                const undoTimeout = delta > 0 ? delta : 0;
                return { ...result, undoTimeout };
            });

            sendingMessageNotificationManager?.setProperties(promise, handleUndo);

            try {
                const { Sent, undoTimeout } = await promise;

                const endSending = async () => {
                    await wait(Math.max(undoTimeout, MIN_DELAY_SENT_NOTIFICATION));
                    if (sendingMessageNotificationManager) {
                        hideNotification(sendingMessageNotificationManager.ID);
                    }
                    if (hasUndo) {
                        // When we close the notification, we consider the message as sent
                        // It's a bit more complicated in reality, the server will take a few more seconds to actually send the message
                        // It creates a small window of time during which the UI allow to reply to message in the outbox
                        // This should be handled by the backend
                        dispatch(endUndo(localID));
                    }
                };

                void endSending();

                dispatch(sent(Sent));

                // Navigation to the sent message
                const {
                    params: { labelID, elementID },
                } = getParamsFromPathname(history.location.pathname);
                if (elementID === Sent.ConversationID) {
                    history.push(
                        setParamsInLocation(history.location, {
                            labelID,
                            elementID: Sent.ConversationID,
                            messageID: Sent.ID,
                        })
                    );
                }
            } catch (error: any) {
                if (
                    ![
                        SAVE_DRAFT_ERROR_CODES.MESSAGE_ALREADY_SENT,
                        SEND_EMAIL_ERROR_CODES.MESSAGE_ALREADY_SENT,
                        SAVE_DRAFT_ERROR_CODES.DRAFT_DOES_NOT_EXIST,
                    ].includes(error?.data?.Code)
                ) {
                    onCompose({
                        existingDraft: {
                            localID,
                            data,
                        },
                        fromUndo: true,
                    });
                }

                throw error;
            }
        },
        [delaySendSeconds]
    );
};
