import { SendPreferences } from 'proton-shared/lib/interfaces/mail/crypto';
import { Attachment, Message } from 'proton-shared/lib/interfaces/mail/Message';
import { SimpleMap } from 'proton-shared/lib/interfaces/utils';
import { getRecipientsAddresses, isAttachPublicKey } from 'proton-shared/lib/mail/messages';
import React, { useCallback } from 'react';
import { useHistory } from 'react-router';
import { c, msgid } from 'ttag';
import { unique } from 'proton-shared/lib/helpers/array';
import { sendMessage, cancelSend } from 'proton-shared/lib/api/messages';
import {
    useApi,
    useEventManager,
    useGetEncryptionPreferences,
    useAuthentication,
    useModals,
    ConfirmModal,
    Alert,
    useNotifications,
} from 'react-components';
import { validateEmailAddress } from 'proton-shared/lib/helpers/email';
import getSendPreferences from 'proton-shared/lib/mail/send/getSendPreferences';

import SendWithErrorsModal from '../components/composer/addresses/SendWithErrorsModal';
import { removeMessageRecipients, uniqueMessageRecipients } from '../helpers/message/cleanMessage';
import { MessageExtendedWithData } from '../models/message';
import { generateTopPackages } from '../helpers/send/sendTopPackages';
import { attachSubPackages } from '../helpers/send/sendSubPackages';
import { encryptPackages } from '../helpers/send/sendEncrypt';
import { useAttachmentCache } from '../containers/AttachmentProvider';
import { updateMessageCache, useMessageCache } from '../containers/MessageProvider';
import { attachPublicKey } from '../helpers/message/messageAttachPublicKey';
import SendWithWarningsModal from '../components/composer/addresses/SendWithWarningsModal';
import SendWithExpirationModal from '../components/composer/addresses/SendWithExpirationModal';
import { useSaveDraft } from './message/useSaveDraft';
import SendingMessageNotification from '../components/notifications/SendingMessageNotification';
import { OnCompose } from './useCompose';
import useDelaySendSeconds from './useDelaySendSeconds';
import { useGetMessageKeys } from './message/useGetMessageKeys';
import { getParamsFromPathname, setParamsInLocation } from '../helpers/mailboxUrl';

export const useSendVerifications = () => {
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const getEncryptionPreferences = useGetEncryptionPreferences();

    return useCallback(async (message: MessageExtendedWithData): Promise<{
        cleanMessage: MessageExtendedWithData;
        mapSendPrefs: SimpleMap<SendPreferences>;
        hasChanged: boolean;
    }> => {
        // Empty subject
        if (!message.data.Subject) {
            await new Promise((resolve, reject) => {
                createModal(
                    <ConfirmModal
                        onConfirm={() => resolve(undefined)}
                        onClose={reject}
                        title={c('Title').t`Message without subject?`}
                        confirm={c('Action').t`Send anyway`}
                    >
                        <Alert>{c('Info')
                            .t`You have not given your email any subject. Do you want to send the message anyway?`}</Alert>
                    </ConfirmModal>
                );
            });
        }

        const uniqueMessage = {
            ...message,
            data: uniqueMessageRecipients(message.data),
        };
        const emails = unique(getRecipientsAddresses(uniqueMessage.data));

        // Invalid addresses
        const invalids = emails.filter((email) => !validateEmailAddress(email));
        if (invalids.length > 0) {
            const invalidAddresses = invalids.join(', ');
            createNotification({
                text: c('Send email with warnings').ngettext(
                    msgid`The following address is not valid: ${invalidAddresses}`,
                    `The following addresses are not valid: ${invalidAddresses}`,
                    invalids.length
                ),
                type: 'error',
            });
            throw new Error();
        }

        const emailWarnings: { [email: string]: string[] } = {};
        const mapSendPrefs: SimpleMap<SendPreferences> = {};
        const sendErrors: { [email: string]: Error } = {};
        const expiresNotEncrypted: string[] = [];

        await Promise.all(
            emails.map(async (email) => {
                const encryptionPreferences = await getEncryptionPreferences(email);
                if (encryptionPreferences.emailAddressWarnings?.length) {
                    emailWarnings[email] = encryptionPreferences.emailAddressWarnings as string[];
                }
                const sendPreferences = getSendPreferences(encryptionPreferences, message.data);
                mapSendPrefs[email] = sendPreferences;
                if (sendPreferences.failure) {
                    sendErrors[email] = sendPreferences.failure?.error;
                }
                if (message.expiresIn && !sendPreferences.encrypt) {
                    expiresNotEncrypted.push(email);
                }
            })
        );

        // Addresses with warnings
        const emailsWithWarnings = Object.keys(emailWarnings);
        if (emailsWithWarnings.length > 0) {
            await new Promise((resolve, reject) => {
                createModal(
                    <SendWithWarningsModal
                        mapWarnings={emailWarnings}
                        onSubmit={() => resolve(undefined)}
                        onClose={reject}
                    />
                );
            });
        }

        // Addresses with errors
        const emailsWithErrors = Object.keys(sendErrors);
        if (emailsWithErrors.length > 0) {
            await new Promise((resolve, reject) => {
                const handleSendAnyway = () => {
                    for (const email of emailsWithErrors) {
                        const indexOfEmail = emails.findIndex((emailAddress) => emailAddress === email);
                        emails.splice(indexOfEmail, 1);
                        delete mapSendPrefs[email];
                    }
                    resolve(undefined);
                };
                createModal(
                    <SendWithErrorsModal
                        mapErrors={sendErrors}
                        cannotSend={emailsWithErrors.length === emails.length}
                        onSubmit={handleSendAnyway}
                        onClose={reject}
                    />
                );
            });
        }

        // Expiration and addresses with no encryptions
        if (expiresNotEncrypted.length > 0) {
            await new Promise((resolve, reject) => {
                createModal(
                    <SendWithExpirationModal
                        emails={expiresNotEncrypted}
                        onSubmit={() => resolve(undefined)}
                        onClose={reject}
                    />
                );
            });
        }

        // TODO
        // if (sendPreferences !== oldSendPreferences) {
        //     // check what is going on. Show modal if encryption downgrade
        // }

        // Prepare and save draft
        const cleanMessage = {
            ...message,
            data: removeMessageRecipients(uniqueMessage.data, emailsWithErrors),
        } as MessageExtendedWithData;

        return { cleanMessage, mapSendPrefs, hasChanged: emailsWithErrors.length > 0 };
    }, []);
};

// Reference: Angular/src/app/composer/services/sendMessage.js

export const useSendMessage = () => {
    const api = useApi();
    const getMessageKeys = useGetMessageKeys();
    const attachmentCache = useAttachmentCache();
    const { call } = useEventManager();
    const messageCache = useMessageCache();
    const auth = useAuthentication();
    const saveDraft = useSaveDraft();
    const history = useHistory();
    const delaySendSeconds = useDelaySendSeconds();
    const { createNotification, hideNotification } = useNotifications();

    return useCallback(
        async (
            inputMessage: MessageExtendedWithData,
            mapSendPrefs: SimpleMap<SendPreferences>,
            onCompose: OnCompose,
            alreadySaved = false
        ) => {
            const { localID, data } = inputMessage;
            const hasUndo = !!delaySendSeconds;

            const handleUndo = async () => {
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
                });
            };

            const prepareMessageToSend = async () => {
                if (!alreadySaved) {
                    await saveDraft(inputMessage);
                }

                const messageKeys = await getMessageKeys(inputMessage.data);

                // Add public key if selected
                if (isAttachPublicKey(inputMessage.data)) {
                    const savedMessage = messageCache.get(localID) as MessageExtendedWithData;
                    const Attachments: Attachment[] = await attachPublicKey(savedMessage, messageKeys, auth.UID);
                    await saveDraft({
                        ...savedMessage,
                        data: { ...savedMessage.data, Attachments },
                    });
                }

                const message = messageCache.get(localID) as MessageExtendedWithData;
                const messageWithGoodFlags = {
                    ...message,
                    data: {
                        ...message.data,
                        Flags: inputMessage.data.Flags,
                    },
                };

                // TODO: handleAttachmentSigs ?

                const emails = unique(getRecipientsAddresses(inputMessage.data));

                let packages = await generateTopPackages(
                    messageWithGoodFlags,
                    messageKeys,
                    mapSendPrefs,
                    attachmentCache,
                    api
                );
                packages = await attachSubPackages(packages, messageWithGoodFlags, emails, mapSendPrefs, api);
                packages = await encryptPackages(messageWithGoodFlags, messageKeys, packages);

                // TODO: Implement retry system
                // const suppress = retry ? [API_CUSTOM_ERROR_CODES.MESSAGE_VALIDATE_KEY_ID_NOT_ASSOCIATED] : [];
                // try {

                // expiresIn is not saved on the API and then empty in `message`, we need to refer to `inputMessage`
                const { expiresIn } = inputMessage;
                const deliveryTime = delaySendSeconds ? Math.floor(Date.now() / 1000) + delaySendSeconds : 0;
                return api<{ Sent: Message; DeliveryTime: number }>(
                    sendMessage(message.data?.ID, {
                        Packages: packages,
                        ExpiresIn: expiresIn === 0 ? undefined : expiresIn,
                        DeliveryTime: deliveryTime,
                    } as any)
                );
            };

            const promise = prepareMessageToSend();

            const notificationID = createNotification({
                text: <SendingMessageNotification promise={promise} onUndo={hasUndo ? handleUndo : undefined} />,
                expiration: -1,
            });

            try {
                const { Sent, DeliveryTime } = await promise;

                const delta = DeliveryTime * 1000 - Date.now();
                const undoTimeout = delta > 0 ? delta : 0;
                setTimeout(
                    () => {
                        hideNotification(notificationID);
                        if (hasUndo) {
                            call();
                        }
                    },
                    hasUndo ? undoTimeout : 2500
                );

                updateMessageCache(messageCache, localID, {
                    data: Sent,
                    initialized: undefined,
                    showEmbeddedImages: undefined,
                });

                call();

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

                // } catch (e) {
                //     if (retry && e.data.Code === API_CUSTOM_ERROR_CODES.MESSAGE_VALIDATE_KEY_ID_NOT_ASSOCIATED) {
                //         sendPreferences.clearCache();
                //         keyCache.clearCache();
                //         // retry if we used the wrong keys
                //         return send(message, parameters, false);
                //     }
                //     throw e;
                // }
            } catch (error) {
                hideNotification(notificationID);
                onCompose({
                    existingDraft: {
                        localID,
                        data,
                    },
                });
                throw error;
            }
        },
        [delaySendSeconds, messageCache, attachmentCache, saveDraft]
    );
};
