import { SendPreferences } from '@proton/shared/lib/interfaces/mail/crypto';
import { SimpleMap } from '@proton/shared/lib/interfaces/utils';
import { EncryptionPreferencesError } from '@proton/shared/lib/mail/encryptionPreferences';
import { getRecipients, getRecipientsAddresses } from '@proton/shared/lib/mail/messages';
import { useCallback } from 'react';
import { c, msgid } from 'ttag';
import { unique } from '@proton/shared/lib/helpers/array';
import { useGetEncryptionPreferences, useModals, useNotifications } from '@proton/components';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import getSendPreferences from '@proton/shared/lib/mail/send/getSendPreferences';
import { normalize } from '@proton/shared/lib/helpers/string';
import { HOUR } from '@proton/shared/lib/constants';
import { serverTime } from 'pmcrypto/lib/serverTime';
import { languageCode, localeCode } from '@proton/shared/lib/i18n';
import SendWithErrorsModal from '../../components/composer/addresses/SendWithErrorsModal';
import { removeMessageRecipients, uniqueMessageRecipients } from '../../helpers/message/cleanMessage';
import SendWithWarningsModal from '../../components/composer/addresses/SendWithWarningsModal';
import SendWithExpirationModal from '../../components/composer/addresses/SendWithExpirationModal';
import SendWithChangedPreferencesModal from '../../components/composer/addresses/SendWithChangedPreferencesModal';
import { MapSendInfo } from '../../models/crypto';
import { locateBlockquote } from '../../helpers/message/messageBlockquote';
import { MESSAGE_ALREADY_SENT_INTERNAL_ERROR } from '../../constants';
import { MessageStateWithData } from '../../logic/messages/messagesTypes';
import { useGetMessage } from '../message/useMessage';
import { useContactsMap } from '../contact/useContacts';

const FR_REGEX =
    /voir pi\u00e8ce jointe|voir pi\u00e8ces jointes|voir fichier joint|voir fichiers joints|voir fichier associ\u00e9|voir fichiers associ\u00e9s|joint|joints|jointe|jointes|joint \u00e0 cet e-mail|jointe \u00e0 cet e-mail|joints \u00e0 cet e-mail|jointes \u00e0 cet e-mail|joint \u00e0 ce message|jointe \u00e0 ce message|joints \u00e0 ce message|jointes \u00e0 ce message|je joins|j'ai joint|ci-joint|pi\u00e8ce jointe|pi\u00e8ces jointes|fichier joint|fichiers joints|voir le fichier joint|voir les fichiers joints|voir la pi\u00e8ce jointe|voir les pi\u00e8ces jointes/gi;
const EN_REGEX =
    /see attached|see attachment|see included|is attached|attached is|are attached|attached are|attached to this email|attached to this message|I'm attaching|I am attaching|I've attached|I have attached|I attach|I attached|find attached|find the attached|find included|find the included|attached file|see the attached|see attachments|attached files|see the attachment|here is the attachment|attached you will find/gi;
const DE_REGEX =
    /siehe Anhang|angeh\u00e4ngt|anbei|hinzugef\u00fcgt|ist angeh\u00e4ngt|angeh\u00e4ngt ist|sind angeh\u00e4ngt|angeh\u00e4ngt sind|an diese E-Mail angeh\u00e4ngt|an diese Nachricht angeh\u00e4ngt|Anhang hinzuf\u00fcgen|Anhang anbei|Anhang hinzugef\u00fcgt|anbei finden|anbei|im Anhang|mit dieser E-Mail sende ich|angeh\u00e4ngte Datei|siehe angeh\u00e4ngte Datei|siehe Anh\u00e4nge|angeh\u00e4ngte Dateien|siehe Anlage|siehe Anlagen/gi;
const ES_REGEX =
    /ver adjunto|ver archivo adjunto|ver archivo incluido|se ha adjuntado|adjuntado|se han adjuntado|adjuntados|se ha adjuntado a este correo|se ha adjuntado a este mensaje|Adjunto te env\u00edo|He adjuntado|He adjuntado un archivo|adjunto|adjunto el archivo|incluyo el archivo|archivo adjunto|mira el archivo adjunto|ver archivos adjuntos|archivos adjuntos|ver el archivo adjunto/gi;
const RU_REGEX = /прикрепленный файл|прикреплённый файл|прикреплен|прикреплён|прикрепил|прикрепила/gi;
const IT_REGEX =
    /vedi in allegato|vedi allegato|vedi accluso|\u00e8 allegato|in allegato|sono allegati|in allegato vi sono|in allegato a questa email|in allegato a questo messaggio|invio in allegato|allego|ho allegato|in allegato trovi|trova in allegato|trova accluso|incluso troverai|file allegato|vedi allegato|vedi allegati|file allegati|vedi l'allegato|ti allego/gi;
const PT_PT_REGEX =
    /ver em anexo|ver anexo|ver inclu\u00eddo|est\u00e1 anexado|est\u00e1 em anexo|est\u00e3o anexados|est\u00e3o em anexo|anexado a este email|anexado a esta mensagem|estou a anexar|anexo|anexei|anexei|anexo|anexei|queira encontrar em anexo|segue em anexo|encontra-se inclu\u00eddo|segue inclu\u00eddo|ficheiro anexado|ver o anexo|ver anexos|ficheiros anexados|ver o anexo/gi;
const PT_BR_REGEX =
    /ver anexado|ver anexo|ver inclu\u00eddo|est\u00e1 anexado|anexado|est\u00e3o anexados|anexados|anexado a este e-mail|anexado a esta mensagem|estou anexando|eu estou anexando|anexei|eu anexei|estou incluindo|eu estou incluindo|inclu\u00ed|eu inclu\u00ed|enviar anexo|enviar o anexo|enviar inclu\u00eddo|ver anexos|arquivo anexado|arquivos anexados|em anexo|anexo|veja em anexo|veja o anexo|veja os anexos/gi;
const NL_REGEX =
    /zie bijgevoegd|zie bijlage|zie toegevoegd|is bijgevoegd|bijgevoegd is|zijn bijgevoegd|bijgevoegd zijn|toegevoegd aan dit e-mailbericht|toegevoegd aan dit bericht|Ik voeg bij|Ik heb bijgevoegd|Ik voeg een bijlage bij|Ik heb een bijlage bijgevoegd|bijlage bijvoegen|bijlagen bijvoegen|bijlage opgenomen|opgenomen bijlage|bijgevoegd bestand|zie de bijlage|zie bijlagen|bijgevoegde bestanden|de bijlage bekijken/gi;
const PL_REGEX =
    /patrz w za\u0142\u0105czeniu|patrz za\u0142\u0105cznik|patrz do\u0142\u0105czony|jest do\u0142\u0105czony|w za\u0142\u0105czeniu|s\u0105 za\u0142\u0105czone|za\u0142\u0105czone s\u0105|za\u0142\u0105czone do tego e-maila|do\u0142\u0105czone do tej wiadomo\u015bci|do\u0142\u0105czam|za\u0142\u0105czam|za\u0142\u0105czy\u0142em|za\u0142\u0105czy\u0142am|dodaj\u0119|wysy\u0142am|do\u0142\u0105czy\u0142em|do\u0142\u0105czy\u0142am|patrz za\u0142\u0105czniki|w za\u0142\u0105czniku|patrz za\u0142\u0105czony|patrz za\u0142\u0105czone|masz w za\u0142\u0105czeniu|za\u0142\u0105czony plik|zobacz za\u0142\u0105cznik|zobacz za\u0142\u0105czniki|za\u0142\u0105czone pliki/gi;

export const useSendVerifications = (
    handleNoRecipients?: () => void,
    handleNoSubjects?: () => void,
    handleNoAttachments?: (keyword: string) => void
) => {
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const getEncryptionPreferences = useGetEncryptionPreferences();
    const getMessage = useGetMessage();
    const contactsMap = useContactsMap();

    const preliminaryVerifications = useCallback(async (message: MessageStateWithData): Promise<void> => {
        const { draftFlags } = getMessage(message.localID) as MessageStateWithData;
        const { isSentDraft } = draftFlags || {};

        // Message already sent
        if (isSentDraft) {
            throw new Error(MESSAGE_ALREADY_SENT_INTERNAL_ERROR);
        }

        // No recipients
        if (!getRecipients(message.data).length) {
            if (handleNoRecipients) {
                await handleNoRecipients();
            }
        }

        // Empty subject
        if (!message.data.Subject) {
            if (handleNoSubjects) {
                await handleNoSubjects();
            }
        }

        const [contentBeforeBlockquote] = locateBlockquote(message.messageDocument?.document);
        const normalized = normalize(`${message.data.Subject} ${contentBeforeBlockquote || ''}`);

        const [keyword] =
            (languageCode === 'en' && normalized.match(EN_REGEX)) ||
            (languageCode === 'fr' && normalized.match(FR_REGEX)) ||
            (languageCode === 'de' && normalized.match(DE_REGEX)) ||
            (languageCode === 'es' && normalized.match(ES_REGEX)) ||
            (languageCode === 'ru' && normalized.match(RU_REGEX)) ||
            (languageCode === 'it' && normalized.match(IT_REGEX)) ||
            (languageCode === 'pt' && normalized.match(PT_PT_REGEX)) ||
            (languageCode === 'pt' && localeCode === 'pt_BR' && normalized.match(PT_BR_REGEX)) ||
            (languageCode === 'nl' && normalized.match(NL_REGEX)) ||
            (languageCode === 'pl' && normalized.match(PL_REGEX)) ||
            [];

        // Attachment word without attachments
        if (keyword && !message.data.Attachments.length) {
            if (handleNoAttachments) {
                await handleNoAttachments(keyword);
            }
        }
    }, []);

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
            } as MessageStateWithData;

            return { cleanMessage, mapSendPrefs, hasChanged: emailsWithErrors.length > 0 };
        },
        [contactsMap]
    );

    return { preliminaryVerifications, extendedVerifications };
};
