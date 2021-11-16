import { useCallback } from 'react';
import { SendPreferences } from '@proton/shared/lib/interfaces/mail/crypto';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { getRecipientsAddresses, setFlag } from '@proton/shared/lib/mail/messages';
import { useHistory } from 'react-router';
import { c } from 'ttag';
import { unique } from '@proton/shared/lib/helpers/array';
import { cancelSend } from '@proton/shared/lib/api/messages';
import { useApi, useEventManager, useNotifications } from '@proton/components';
import { wait } from '@proton/shared/lib/helpers/promise';
import { MAILBOX_LABEL_IDS, MIME_TYPES } from '@proton/shared/lib/constants';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { useDispatch } from 'react-redux';
import { DecryptResultPmcrypto } from 'pmcrypto';
import { MessageExtendedWithData } from '../../models/message';
import { generateTopPackages } from '../../helpers/send/sendTopPackages';
import { attachSubPackages } from '../../helpers/send/sendSubPackages';
import { sendFormatter } from '../../helpers/send/sendFormatter';
import { encryptPackages } from '../../helpers/send/sendEncrypt';
import { updateMessageCache, useMessageCache } from '../../containers/MessageProvider';
import { SendingMessageNotificationManager } from '../../components/notifications/SendingMessageNotification';
import { OnCompose } from './useCompose';
import useDelaySendSeconds from '../useDelaySendSeconds';
import { useGetMessageKeys } from '../message/useGetMessageKeys';
import { getParamsFromPathname, setParamsInLocation } from '../../helpers/mailboxUrl';
import { useSendMoficiations } from './useSendModifications';
import { SAVE_DRAFT_ERROR_CODES, SEND_EMAIL_ERROR_CODES } from '../../constants';
import { updateAttachment } from '../../logic/attachments/attachmentsActions';
import { useGetAttachment } from '../useAttachment';

const MIN_DELAY_SENT_NOTIFICATION = 2500;

// Reference: Angular/src/app/composer/services/sendMessage.js

interface UseSendMessageParameters {
    inputMessage: MessageExtendedWithData;
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
    const messageCache = useMessageCache();
    const history = useHistory<any>();
    const delaySendSeconds = useDelaySendSeconds();
    const { createNotification, hideNotification } = useNotifications();
    const sendModification = useSendMoficiations();

    const onUpdateAttachment = (ID: string, attachment: DecryptResultPmcrypto) => {
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
                const savedMessage = messageCache.get(localID) as MessageExtendedWithData;
                await api(cancelSend(savedMessage.data.ID));
                createNotification({ text: c('Message notification').t`Sending undone` });
                await call();
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
                const message = (await sendModification(inputMessage)) as MessageExtendedWithData;

                // TODO: handleAttachmentSigs ?

                const emails = unique(getRecipientsAddresses(inputMessage.data));

                const hasHtml = Object.values(mapSendPrefs).some(
                    (sendPref) => sendPref?.mimeType === MIME_TYPES.DEFAULT
                );
                if (hasHtml && message.document === undefined) {
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
                const { expiresIn, autoSaveContacts, scheduledAt } = inputMessage;

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
                        // It's a bit more complicated in reallity, the server will take a few more seconds to actully send the message
                        // It creates a small window of time during which the UI allow to reply to message in the outbox
                        // This should be handled by the backend
                        const message = messageCache.get(localID) as MessageExtendedWithData;
                        updateMessageCache(messageCache, localID, {
                            data: {
                                LabelIDs: message.data.LabelIDs.filter((value) => value !== MAILBOX_LABEL_IDS.OUTBOX),
                                Flags: setFlag(MESSAGE_FLAGS.FLAG_SENT)(message.data),
                            },
                        });
                    }
                };

                void endSending();

                updateMessageCache(messageCache, localID, {
                    data: Sent,
                    initialized: undefined,
                    plainText: undefined,
                    document: undefined,
                    messageImages: undefined,
                });

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
        [delaySendSeconds, messageCache]
    );
};
