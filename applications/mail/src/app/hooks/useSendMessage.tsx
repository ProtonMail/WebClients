import React, { useCallback } from 'react';
import { c, msgid } from 'ttag';
import { unique } from 'proton-shared/lib/helpers/array';
import { sendMessage } from 'proton-shared/lib/api/messages';
import {
    useGetAddressKeys,
    useApi,
    useEventManager,
    useGetEncryptionPreferences,
    useAuthentication,
    useModals,
    ConfirmModal,
    Alert,
    useNotifications
} from 'react-components';

import SendWithErrorsModal from '../components/composer/addresses/SendWithErrorsModal';
import { removeMessageRecipients, uniqueMessageRecipients } from '../helpers/message/cleanMessage';
import { MapSendPreferences } from '../models/crypto';
import { MessageExtendedWithData } from '../models/message';
import { getRecipientsAddresses, isAttachPublicKey } from '../helpers/message/messages';
import getSendPreferences from '../helpers/message/getSendPreferences';
import { generateTopPackages } from '../helpers/send/sendTopPackages';
import { attachSubPackages } from '../helpers/send/sendSubPackages';
import { encryptPackages } from '../helpers/send/sendEncrypt';
import { useAttachmentCache } from '../containers/AttachmentProvider';
import { updateMessageCache, useMessageCache } from '../containers/MessageProvider';
import { attachPublicKey } from '../helpers/message/messageAttachPublicKey';
import { Attachment } from '../models/attachment';
import { validateEmailAddress } from 'proton-shared/lib/helpers/string';
import SendWithWarningsModal from '../components/composer/addresses/SendWithWarningsModal';
import SendWithExpirationModal from '../components/composer/addresses/SendWithExpirationModal';
import { useSaveDraft } from './useMessageWriteActions';

export const useSendVerifications = () => {
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const getEncryptionPreferences = useGetEncryptionPreferences();

    return useCallback(async (message: MessageExtendedWithData): Promise<{
        cleanMessage: MessageExtendedWithData;
        mapSendPrefs: MapSendPreferences;
    }> => {
        // Empty subject
        if (!message.data.Subject) {
            await new Promise((resolve, reject) => {
                createModal(
                    <ConfirmModal
                        onConfirm={resolve}
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
            data: uniqueMessageRecipients(message.data)
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
                type: 'error'
            });
            throw new Error();
        }

        const emailWarnings: { [email: string]: string[] } = {};
        const mapSendPrefs: MapSendPreferences = {};
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
                createModal(<SendWithWarningsModal mapWarnings={emailWarnings} onSubmit={resolve} onClose={reject} />);
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
                    resolve();
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
                    <SendWithExpirationModal emails={expiresNotEncrypted} onSubmit={resolve} onClose={reject} />
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
            data: removeMessageRecipients(uniqueMessage.data, emailsWithErrors)
        } as MessageExtendedWithData;

        return { cleanMessage, mapSendPrefs };
    }, []);
};

// Reference: Angular/src/app/composer/services/sendMessage.js

export const useSendMessage = () => {
    const cache = new Map(); // TODO
    const api = useApi();
    const getAddressKeys = useGetAddressKeys();
    const attachmentCache = useAttachmentCache();
    const { call } = useEventManager();
    const messageCache = useMessageCache();
    const auth = useAuthentication();
    const saveDraft = useSaveDraft();

    return useCallback(
        async (inputMessage: MessageExtendedWithData, mapSendPrefs: MapSendPreferences) => {
            // Add public key if selected
            const Attachments: Attachment[] = isAttachPublicKey(inputMessage.data)
                ? await attachPublicKey(inputMessage, auth.UID)
                : inputMessage.data.Attachments;

            // Processed message representing what we send
            const messageToSave: MessageExtendedWithData = {
                ...inputMessage,
                data: { ...inputMessage.data, Attachments }
            };

            await saveDraft(messageToSave);

            const message = messageCache.get(messageToSave.localID) as MessageExtendedWithData;

            // TODO: handleAttachmentSigs ?

            const emails = unique(getRecipientsAddresses(inputMessage.data));

            let packages = await generateTopPackages(message, mapSendPrefs, attachmentCache, api);
            packages = await attachSubPackages(packages, message, emails, mapSendPrefs);
            packages = await encryptPackages(message, packages, getAddressKeys);

            // TODO: Implement retry system
            // const suppress = retry ? [API_CUSTOM_ERROR_CODES.MESSAGE_VALIDATE_KEY_ID_NOT_ASSOCIATED] : [];
            // try {
            const { Sent } = await api(
                sendMessage(message.data?.ID, {
                    Packages: packages,
                    ExpiresIn: message.expiresIn === 0 ? undefined : message.expiresIn
                } as any)
            );
            await call();

            updateMessageCache(messageCache, inputMessage.localID, { data: Sent });

            // } catch (e) {
            //     if (retry && e.data.Code === API_CUSTOM_ERROR_CODES.MESSAGE_VALIDATE_KEY_ID_NOT_ASSOCIATED) {
            //         sendPreferences.clearCache();
            //         keyCache.clearCache();
            //         // retry if we used the wrong keys
            //         return send(message, parameters, false);
            //     }
            //     throw e;
            // }
        },
        [cache]
    );
};
