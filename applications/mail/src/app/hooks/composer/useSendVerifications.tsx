import { SendPreferences } from 'proton-shared/lib/interfaces/mail/crypto';
import { SimpleMap } from 'proton-shared/lib/interfaces/utils';
import { EncryptionPreferencesError } from 'proton-shared/lib/mail/encryptionPreferences';
import { getRecipients, getRecipientsAddresses } from 'proton-shared/lib/mail/messages';
import React, { useCallback } from 'react';
import { c, msgid } from 'ttag';
import { unique } from 'proton-shared/lib/helpers/array';
import { useGetEncryptionPreferences, useModals, ConfirmModal, Alert, useNotifications } from 'react-components';
import { validateEmailAddress } from 'proton-shared/lib/helpers/email';
import getSendPreferences from 'proton-shared/lib/mail/send/getSendPreferences';
import SendWithErrorsModal from '../../components/composer/addresses/SendWithErrorsModal';
import { removeMessageRecipients, uniqueMessageRecipients } from '../../helpers/message/cleanMessage';
import { MessageExtendedWithData } from '../../models/message';
import SendWithWarningsModal from '../../components/composer/addresses/SendWithWarningsModal';
import SendWithExpirationModal from '../../components/composer/addresses/SendWithExpirationModal';
import { useContactCache } from '../../containers/ContactProvider';

export const useSendVerifications = () => {
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const getEncryptionPreferences = useGetEncryptionPreferences();
    const { contactsMap } = useContactCache();

    const preliminaryVerifications = useCallback(async (message: MessageExtendedWithData): Promise<void> => {
        // No recipients
        if (!getRecipients(message.data).length) {
            await new Promise((resolve, reject) => {
                createModal(
                    <ConfirmModal
                        onConfirm={reject}
                        onClose={reject}
                        title={c('Title').t`No recipient`}
                        confirm={c('Action').t`OK`}
                        cancel={null}
                    >
                        <Alert type="warning">{c('Info').t`Please add at least one recipient before sending.`}</Alert>
                    </ConfirmModal>
                );
            });
        }

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
    }, []);

    const extendedVerifications = useCallback(
        async (
            message: MessageExtendedWithData
        ): Promise<{
            cleanMessage: MessageExtendedWithData;
            mapSendPrefs: SimpleMap<SendPreferences>;
            hasChanged: boolean;
        }> => {
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
            const sendErrors: { [email: string]: EncryptionPreferencesError } = {};
            const expiresNotEncrypted: string[] = [];

            await Promise.all(
                emails.map(async (email) => {
                    const encryptionPreferences = await getEncryptionPreferences(email, 0, contactsMap);
                    console.log('useSendVerification', email, encryptionPreferences);
                    if (encryptionPreferences.emailAddressWarnings?.length) {
                        emailWarnings[email] = encryptionPreferences.emailAddressWarnings as string[];
                    }
                    const sendPreferences = getSendPreferences(encryptionPreferences, message.data);
                    mapSendPrefs[email] = sendPreferences;
                    if (sendPreferences.error) {
                        sendErrors[email] = sendPreferences.error;
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
        },
        [contactsMap]
    );

    return { preliminaryVerifications, extendedVerifications };
};
