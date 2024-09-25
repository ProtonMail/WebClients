import { useCallback } from 'react';

import { c, msgid } from 'ttag';

import { useGetEncryptionPreferences, useModals, useNotifications } from '@proton/components';
import { serverTime } from '@proton/crypto';
import { HOUR } from '@proton/shared/lib/constants';
import { isNoReplyEmail, validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { mentionAttachment } from '@proton/shared/lib/helpers/emailAttachment';
import { getItem } from '@proton/shared/lib/helpers/storage';
import { normalize } from '@proton/shared/lib/helpers/string';
import type { SendPreferences } from '@proton/shared/lib/interfaces/mail/crypto';
import type { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import type { EncryptionPreferencesError } from '@proton/shared/lib/mail/encryptionPreferences';
import { getRecipients, getRecipientsAddresses, isPlainText } from '@proton/shared/lib/mail/messages';
import getSendPreferences from '@proton/shared/lib/mail/send/getSendPreferences';
import unique from '@proton/utils/unique';

import SendWithChangedPreferencesModal, {
    PREFERENCE_CHANGE_TYPE,
} from '../../components/composer/addresses/SendWithChangedPreferencesModal';
import SendWithErrorsModal from '../../components/composer/addresses/SendWithErrorsModal';
import SendWithExpirationModal from '../../components/composer/addresses/SendWithExpirationModal';
import SendWithWarningsModal from '../../components/composer/addresses/SendWithWarningsModal';
import { MESSAGE_ALREADY_SENT_INTERNAL_ERROR, NO_REPLY_EMAIL_DONT_SHOW_AGAIN_KEY } from '../../constants';
import { removeMessageRecipients, uniqueMessageRecipients } from '../../helpers/message/cleanMessage';
import { locateBlockquote } from '../../helpers/message/messageBlockquote';
import type { MapSendInfo } from '../../models/crypto';
import type { MessageStateWithData } from '../../store/messages/messagesTypes';
import { useContactsMap } from '../contact/useContacts';
import { useGetMessage } from '../message/useMessage';

interface Verifications {
    alreadySent?: boolean;
    noRecipients?: boolean;
    noSubject?: boolean;
    noReplyEmail?: boolean;
    noAttachments?: boolean;
}

// By default, all verifications are enabled
const defaultVerifications: Verifications = {
    alreadySent: true,
    noRecipients: true,
    noSubject: true,
    noReplyEmail: true,
    noAttachments: true,
};

export const useSendVerifications = (
    handleNoRecipients?: () => void,
    handleNoSubjects?: () => void,
    handleNoAttachments?: (keyword: string) => void,
    handleNoReplyEmail?: (email: string) => void
) => {
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const getEncryptionPreferences = useGetEncryptionPreferences();
    const getMessage = useGetMessage();
    const contactsMap = useContactsMap();
    const dontShowNoReplyAgain = getItem(NO_REPLY_EMAIL_DONT_SHOW_AGAIN_KEY) === 'true';

    const preliminaryVerifications = useCallback(
        async (message: MessageStateWithData, optionalVerifications: Verifications = {}): Promise<void> => {
            const verifications = {
                ...defaultVerifications,
                ...optionalVerifications,
            };
            const { draftFlags } = getMessage(message.localID) as MessageStateWithData;
            const { isSentDraft } = draftFlags || {};

            // Message already sent
            if (verifications.alreadySent && isSentDraft) {
                throw new Error(MESSAGE_ALREADY_SENT_INTERNAL_ERROR);
            }

            // No recipients
            if (verifications.noRecipients && !getRecipients(message.data).length) {
                if (handleNoRecipients) {
                    await handleNoRecipients();
                }
            }

            // Skip no-reply email detection if the user has already dismissed the modal
            if (verifications.noReplyEmail && !dontShowNoReplyAgain) {
                // Detect if the user tries to send a message to a no-reply email address
                const emails = getRecipientsAddresses(message.data);
                const noReplyEmail = emails.find((email) => isNoReplyEmail(email));

                // If a no-reply email address is detected, display a modal asking the user if they want to send the message anyway
                if (noReplyEmail) {
                    if (handleNoReplyEmail) {
                        await handleNoReplyEmail(noReplyEmail);
                    }
                }
            }

            // Empty subject
            if (verifications.noSubject && !message.data.Subject) {
                if (handleNoSubjects) {
                    await handleNoSubjects();
                }
            }

            if (verifications.noAttachments && !isPlainText(message.data)) {
                const [contentBeforeBlockquote] = locateBlockquote(message.messageDocument?.document);
                const normalized = normalize(`${message.data.Subject} ${contentBeforeBlockquote || ''}`);
                const [keyword] = mentionAttachment(normalized) || [];

                // Attachment word without attachments
                if (keyword && !message.data.Attachments.length) {
                    if (handleNoAttachments) {
                        await handleNoAttachments(keyword);
                    }
                }
            }
        },
        []
    );

    const extendedVerifications = useCallback(
        async (
            message: MessageStateWithData,
            trustedMapSendInfo: MapSendInfo
        ): Promise<{
            cleanMessage: MessageStateWithData;
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
            const emailsWithE2EEDisabled: string[] = [];
            const expiresNotEncrypted: string[] = [];

            await Promise.all(
                emails.map(async (email) => {
                    let sendPreferences;
                    // We need to retrieve the most recent encryption preferences (thus bypassing & updating the cache), to avoid missing any of the latest legitimate changes
                    // that occured after the last contact update we received. This also re-downloads public encryption keys (both pinned and not).
                    // However, at this point the server could provide malicious encryption information, and the user cannot visually check
                    // whether something is off through the send status icons.
                    // Hence, we must compare the newly fetched data with the cached one, which the user could verify before hitting Send.
                    const lastMinuteEncryptionPrefs = await getEncryptionPreferences({
                        email,
                        lifetime: 0,
                        contactEmailsMap: contactsMap,
                    });
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
                        const lastMinuteSignatureAge = Math.abs(+lastMinuteSignatureTime - +serverTime());
                        if (
                            +lastMinuteSignatureTime < +cachedSignatureTime ||
                            (+lastMinuteSignatureTime !== +cachedSignatureTime && lastMinuteSignatureAge > 24 * HOUR)
                        ) {
                            // The server sent us an old last-minute contact signature. This should never happen, since the server time is used when signing.
                            // This might be an attempt to downgrade the encryption preferences, so we silently discard last-minute prefs and send with cached ones.
                            sendPreferences = cachedSendInfo.sendPreferences!;
                        } else {
                            // The last-minute signature is newer than the cached one, and was created recently enough, so
                            // even if the pinned keys are removed at the last minute, we can be positive that the user made those changes.
                            // Thus, we can now trust & use the last-minute preferences.
                            sendPreferences = getSendPreferences(lastMinuteEncryptionPrefs, message.data);
                            // In the case of internal addresses with E2EE disabled for mail, pinned keys are automatically ignored.
                            // So even if the last-minute contact signature is verified, we must warn the user if the recipient has just disabled E2EE on their address
                            if (
                                sendPreferences.encryptionDisabled &&
                                !cachedSendInfo.sendPreferences?.encryptionDisabled
                            ) {
                                emailsWithE2EEDisabled.push(email);
                            }
                        }
                    }
                    mapSendPrefs[email] = sendPreferences;
                    if (sendPreferences.error) {
                        sendErrors[email] = sendPreferences.error;
                    }
                    if (message.draftFlags?.expiresIn && !sendPreferences.encrypt) {
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

            // Addresses where E2EE was disabled at the last minute
            if (emailsWithE2EEDisabled.length > 0) {
                await new Promise((resolve, reject) => {
                    createModal(
                        <SendWithChangedPreferencesModal
                            emails={emailsWithE2EEDisabled}
                            changeType={PREFERENCE_CHANGE_TYPE.E2EE_DISABLED}
                            onSubmit={() => resolve(undefined)}
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
                            changeType={PREFERENCE_CHANGE_TYPE.CONTACT_DELETED}
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
            } as MessageStateWithData;

            return { cleanMessage, mapSendPrefs, hasChanged: emailsWithErrors.length > 0 };
        },
        [contactsMap]
    );

    return { preliminaryVerifications, extendedVerifications };
};
