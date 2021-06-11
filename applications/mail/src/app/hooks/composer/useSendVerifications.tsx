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
import { HOUR } from 'proton-shared/lib/constants';
import { serverTime } from 'pmcrypto/lib/serverTime';
import SendWithErrorsModal from '../../components/composer/addresses/SendWithErrorsModal';
import { removeMessageRecipients, uniqueMessageRecipients } from '../../helpers/message/cleanMessage';
import { MessageExtendedWithData } from '../../models/message';
import SendWithWarningsModal from '../../components/composer/addresses/SendWithWarningsModal';
import SendWithExpirationModal from '../../components/composer/addresses/SendWithExpirationModal';
import SendWithChangedPreferencesModal from '../../components/composer/addresses/SendWithChangedPreferencesModal';
import { useContactCache } from '../../containers/ContactProvider';
import { MapSendInfo } from '../../models/crypto';

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
            message: MessageExtendedWithData,
            trustedMapSendInfo: MapSendInfo
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
            const emailsWithMissingPreferences: string[] = [];
            const expiresNotEncrypted: string[] = [];

            await Promise.all(
                emails.map(async (email) => {
                    let sendPreferences;
                    // We need to retrieve the most recent encryption preferences (thus bypassing & updating the cache), to avoid missing any of the latest legitimate changes
                    // that occured after the last contact update we received. This also re-downloads public encryption keys (both pinned and not).
                    // However, at this point the server could provide malicious encryption information, and the user cannot visually check
                    // whether something is off through the send status icons.
                    // Hence, we must compare the newly fetched data with the cached one, which the user could verify before hitting Send.
                    const lastMinuteEncryptionPrefs = await getEncryptionPreferences(email, 0, contactsMap);
                    if (lastMinuteEncryptionPrefs.emailAddressWarnings?.length) {
                        emailWarnings[email] = lastMinuteEncryptionPrefs.emailAddressWarnings as string[];
                    }
                    const cachedSendInfo = trustedMapSendInfo[email];
                    if (!cachedSendInfo || !cachedSendInfo.contactSignatureInfo?.isVerified) {
                        // Cached data might not be available if the user clicks 'Send' before the icons are loaded,
                        // or in the UnsubscribeBanner context. In both cases, it's fine to use the last-minute preferences.
                        sendPreferences = getSendPreferences(lastMinuteEncryptionPrefs, message.data);
                    } else if (!lastMinuteEncryptionPrefs.isContactSignatureVerified) {
                        // The signed contact was deleted, or the contact signature was removed.
                        // Note: unpinning a key still results in a new signed contact body, so this block does not deal with that case.

                        if (
                            cachedSendInfo.sendPreferences?.encrypt &&
                            cachedSendInfo.sendPreferences?.isPublicKeyPinned
                        ) {
                            // We warn the user if the contact previously had encryption enabled and included a valid trusted key.
                            // This is needed because we cannot tell whether the user deleted the contact, or whether the action was faked by the server to try
                            // to downgrade encryption preferences maliciously.
                            emailsWithMissingPreferences.push(email);
                        }
                        sendPreferences = getSendPreferences(lastMinuteEncryptionPrefs, message.data);
                    } else {
                        // We have both verified cached preferences and verified last-minute preferences.
                        // We must check that the last-minute preferences' signature is newer than the cached one, and that it was created recently,
                        // otherwise the server might be trying to downgrade the encryption preferences maliciously.
                        const cachedSignatureTime = cachedSendInfo.contactSignatureInfo.creationTime!;
                        const lastMinuteSignatureTime = lastMinuteEncryptionPrefs.contactSignatureTimestamp!;
                        const lastMinuteSignatureAge = Math.abs(+lastMinuteSignatureTime - serverTime());
                        if (+lastMinuteSignatureTime < +cachedSignatureTime || lastMinuteSignatureAge > 24 * HOUR) {
                            // The server sent us an old last-minute contact signature. This should never happen, since the server time is used when signing.
                            // This might be an attempt to downgrade the encryption preferences, so we silently discard last-minute prefs and send with cached ones.
                            sendPreferences = cachedSendInfo.sendPreferences!;
                        } else {
                            // The last-minute signature is newer than the cached one, and was created recently enough, so
                            // even if the pinned keys are removed at the last minute, we can be positive that the user made those changes.
                            // Thus, we can now trust & use the last-minute preferences.
                            sendPreferences = getSendPreferences(lastMinuteEncryptionPrefs, message.data);
                        }
                    }
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

            // Addresses with sending errors
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

            // Addresses with missing preferences
            if (emailsWithMissingPreferences.length > 0) {
                await new Promise((resolve, reject) => {
                    createModal(
                        <SendWithChangedPreferencesModal
                            emails={emailsWithMissingPreferences}
                            onSubmit={() => resolve(undefined)}
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
