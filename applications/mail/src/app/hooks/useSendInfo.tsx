import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { useGetEncryptionPreferences, useKeyTransparencyContext } from '@proton/components';
import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import type { PublicKeyReference } from '@proton/crypto';
import useIsMounted from '@proton/hooks/useIsMounted';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { processApiRequestsSafe } from '@proton/shared/lib/api/helpers/safeApiRequests';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { omit } from '@proton/shared/lib/helpers/object';
import type { KeyTransparencyActivation } from '@proton/shared/lib/interfaces';
import type { Recipient } from '@proton/shared/lib/interfaces/Address';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import type { GetEncryptionPreferences } from '@proton/shared/lib/interfaces/hooks/GetEncryptionPreferences';
import { ENCRYPTION_PREFERENCES_ERROR_TYPES } from '@proton/shared/lib/mail/encryptionPreferences';
import { getRecipientsAddresses } from '@proton/shared/lib/mail/messages';
import getSendPreferences from '@proton/shared/lib/mail/send/getSendPreferences';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import AskForKeyPinningModal from '../components/composer/addresses/AskForKeyPinningModal';
import ContactResignModal from '../components/message/modals/ContactResignModal';
import { getSendStatusIcon } from '../helpers/message/icon';
import type { MapSendInfo } from '../models/crypto';
import { STATUS_ICONS_FILLS } from '../models/crypto';
import type { ContactsMap } from '../store/contacts/contactsTypes';
import { useContactsMap } from './contact/useContacts';

const getSignText = (n: number, contactNames: string, contactAddresses: string) => {
    return c('Info').ngettext(
        msgid`The verification of ${contactNames} has failed: the contact is not signed correctly.
                                    This may be the result of a password reset.
                                    You must re-sign the contact in order to send a message to ${contactAddresses} or edit the contact.`,
        `The verification of ${contactNames} has failed: the contacts are not signed correctly.
                                    This may be the result of a password reset.
                                    You must re-sign the contacts in order to send a message to ${contactAddresses} or edit the contacts.`,
        n
    );
};

export interface MessageSendInfo {
    message: MessageState;
    mapSendInfo: MapSendInfo;
    setMapSendInfo: Dispatch<SetStateAction<MapSendInfo>>;
}

export const useMessageSendInfo = (message: MessageState) => {
    const isMounted = useIsMounted();
    // Map of send preferences and send icons for each recipient
    const [mapSendInfo, setMapSendInfo] = useState<MapSendInfo>({});
    const safeSetMapSendInfo = (value: SetStateAction<MapSendInfo>) => isMounted() && setMapSendInfo(value);

    // Use memo is ok there but not really effective as any message change will update the ref
    const messageSendInfo: MessageSendInfo = useMemo(
        () => ({
            message,
            mapSendInfo,
            setMapSendInfo: safeSetMapSendInfo,
        }),
        [message, mapSendInfo]
    );

    return messageSendInfo;
};

export const useUpdateRecipientSendInfo = (
    messageSendInfo: MessageSendInfo | undefined,
    recipient: Recipient,
    onRemove: () => void
) => {
    const getEncryptionPreferences = useGetEncryptionPreferences();
    const contactsMap = useContactsMap();
    const emailAddress = recipient.Address;
    const { ktActivation } = useKeyTransparencyContext();

    const [askForKeyPinningModal, handleShowAskForKeyPinningModal] = useModalTwo(AskForKeyPinningModal);

    const [contactResignModal, handleContactResignModal] = useModalTwo(ContactResignModal);

    const handleRemove = () => {
        if (messageSendInfo) {
            const { setMapSendInfo } = messageSendInfo;
            setMapSendInfo((mapSendInfo) => omit(mapSendInfo, [emailAddress]));
        }
        onRemove();
    };

    useEffect(() => {
        const updateRecipientIcon = async (): Promise<void> => {
            // Inactive if no send info or data already present
            if (!messageSendInfo || messageSendInfo.mapSendInfo[emailAddress]) {
                return;
            }
            const { message, setMapSendInfo } = messageSendInfo;
            const emailValidation = validateEmailAddress(emailAddress);

            // Prevent sending request if email is not even valid
            if (!emailValidation) {
                setMapSendInfo((mapSendInfo) => ({
                    ...mapSendInfo,
                    [emailAddress]: {
                        encryptionPreferenceError: ENCRYPTION_PREFERENCES_ERROR_TYPES.EMAIL_ADDRESS_ERROR,
                        sendPreferences: undefined,
                        sendIcon: {
                            colorClassName: 'color-danger',
                            isEncrypted: false,
                            fill: STATUS_ICONS_FILLS.FAIL,
                            text: c('Composer email icon').t`The address might be misspelled`,
                        },
                        loading: false,
                        emailValidation,
                        emailAddressWarnings: [],
                        contactSignatureInfo: undefined,
                    },
                }));
                return;
            }
            setMapSendInfo((mapSendInfo) => ({
                ...mapSendInfo,
                [emailAddress]: {
                    loading: true,
                    emailValidation,
                },
            }));
            const encryptionPreferences = await getEncryptionPreferences({
                email: emailAddress,
                lifetime: 0,
                contactEmailsMap: contactsMap,
            });
            const sendPreferences = getSendPreferences(encryptionPreferences, message.data);

            if (sendPreferences.error?.type === ENCRYPTION_PREFERENCES_ERROR_TYPES.CONTACT_SIGNATURE_NOT_VERIFIED) {
                if (!recipient.ContactID) {
                    return;
                }
                const contact = { contactID: recipient.ContactID };

                const contactAddress = recipient.Address;
                const contactName = recipient.Name || contactAddress;

                const text = getSignText(1, contactName, contactAddress);

                await handleContactResignModal({
                    title: c('Title').t`Re-sign contact`,
                    contacts: [contact],
                    onNotResign: onRemove,
                    onError: handleRemove,
                    children: text,
                });

                return updateRecipientIcon();
            }

            if (sendPreferences.error?.type === ENCRYPTION_PREFERENCES_ERROR_TYPES.PRIMARY_NOT_PINNED) {
                if (!recipient.ContactID) {
                    return;
                }
                const contacts = [
                    {
                        contactID: recipient.ContactID,
                        emailAddress,
                        isInternal: encryptionPreferences.isInternal,
                        bePinnedPublicKey: encryptionPreferences.sendKey as PublicKeyReference,
                    },
                ];

                await handleShowAskForKeyPinningModal({
                    contacts,
                    onNotTrust: handleRemove,
                    onError: handleRemove,
                });

                return updateRecipientIcon();
            }
            const sendIcon = getSendStatusIcon(sendPreferences);
            const contactSignatureInfo = {
                isVerified: encryptionPreferences.isContactSignatureVerified,
                creationTime: encryptionPreferences.contactSignatureTimestamp,
            };

            setMapSendInfo((mapSendInfo) => ({
                ...mapSendInfo,
                [emailAddress]: {
                    sendPreferences,
                    sendIcon,
                    loading: false,
                    emailValidation,
                    encryptionPreferenceError: encryptionPreferences.error?.type,
                    emailAddressWarnings: encryptionPreferences.emailAddressWarnings || [],
                    contactSignatureInfo,
                },
            }));
        };

        void updateRecipientIcon();
    }, [emailAddress, contactsMap, ktActivation]);

    return { handleRemove, askForKeyPinningModal, contactResignModal };
};

interface LoadParams {
    emailAddress: string;
    contactID: string;
    contactName: string;
    abortController: AbortController;
    checkForError: boolean;
}

export const useUpdateGroupSendInfo = (
    messageSendInfo: MessageSendInfo | undefined,
    contacts: ContactEmail[],
    onRemove: () => void
) => {
    const getEncryptionPreferences = useGetEncryptionPreferences();
    const contactsMap = useContactsMap();
    const emailsInGroup = contacts.map(({ Email }) => Email);

    const [askForKeyPinningModal, handleShowAskForKeyPinningModal] = useModalTwo(AskForKeyPinningModal);

    const [contactResignModal, handleContactResignModal] = useModalTwo(ContactResignModal);

    const handleRemove = () => {
        if (messageSendInfo) {
            const { setMapSendInfo } = messageSendInfo;
            setMapSendInfo((mapSendInfo) => omit(mapSendInfo, emailsInGroup));
        }
        onRemove();
    };

    const { ktActivation } = useKeyTransparencyContext();

    useEffect(() => {
        const abortController = new AbortController();
        // loadSendIcon tries to load the corresponding icon for an email address. If all goes well, it returns nothing.
        // If there are errors, it returns an error type and information about the email address that failed
        const loadSendIcon = async ({
            emailAddress,
            contactID,
            contactName,
            abortController,
            checkForError,
        }: LoadParams) => {
            const { signal } = abortController;
            const icon = messageSendInfo?.mapSendInfo[emailAddress]?.sendIcon;
            const emailValidation = validateEmailAddress(emailAddress);
            if (
                !emailValidation ||
                !emailAddress ||
                icon ||
                !messageSendInfo ||
                !!messageSendInfo.mapSendInfo[emailAddress] ||
                signal.aborted
            ) {
                return;
            }

            const { message, setMapSendInfo } = messageSendInfo;
            if (!signal.aborted) {
                setMapSendInfo((mapSendInfo) => {
                    const sendInfo = mapSendInfo[emailAddress];
                    return {
                        ...mapSendInfo,
                        [emailAddress]: { ...sendInfo, loading: true, emailValidation },
                    };
                });
            }
            const encryptionPreferences = await getEncryptionPreferences({
                email: emailAddress,
                lifetime: 0,
                contactEmailsMap: contactsMap,
            });
            const sendPreferences = getSendPreferences(encryptionPreferences, message.data);
            const sendIcon = getSendStatusIcon(sendPreferences);
            const contactSignatureInfo = {
                isVerified: encryptionPreferences.isContactSignatureVerified,
                creationTime: encryptionPreferences.contactSignatureTimestamp,
            };
            if (!signal.aborted) {
                setMapSendInfo((mapSendInfo) => ({
                    ...mapSendInfo,
                    [emailAddress]: {
                        sendPreferences,
                        sendIcon,
                        loading: false,
                        emailValidation,
                        emailAddressWarnings: encryptionPreferences.emailAddressWarnings || [],
                        contactSignatureInfo,
                    },
                }));
            }
            if (checkForError && sendPreferences.error) {
                return {
                    error: sendPreferences.error,
                    contact: {
                        contactID,
                        contactName,
                        emailAddress,
                        isInternal: encryptionPreferences.isInternal,
                        bePinnedPublicKey: encryptionPreferences.sendKey as PublicKeyReference,
                    },
                };
            }
        };

        const loadSendIcons = async ({
            abortController,
            checkForError,
        }: Pick<LoadParams, 'abortController' | 'checkForError'>): Promise<void> => {
            const requests = contacts.map(
                ({ Email, ContactID, Name }) =>
                    () =>
                        loadSendIcon({
                            emailAddress: Email,
                            contactID: ContactID,
                            contactName: Name,
                            abortController,
                            checkForError,
                        })
            );
            // the routes called in requests support 100 calls every 10 seconds
            const results = await processApiRequestsSafe(requests, 100, 10 * 1000);
            const contactsResign = results
                .filter(isTruthy)
                .filter(
                    ({ error: { type } }) => type === ENCRYPTION_PREFERENCES_ERROR_TYPES.CONTACT_SIGNATURE_NOT_VERIFIED
                )
                .map(({ contact }) => contact);
            const totalContactsResign = contactsResign.length;
            if (totalContactsResign) {
                const title = c('Title').ngettext(msgid`Re-sign contact`, `Re-sign contacts`, totalContactsResign);
                const contactNames = contactsResign.map(({ contactName }) => contactName).join(', ');
                const contactAddresses = contactsResign.map(({ emailAddress }) => emailAddress).join(', ');

                const text = getSignText(totalContactsResign, contactNames, contactAddresses);

                await handleContactResignModal({
                    title: title,
                    contacts: contactsResign,
                    onNotResign: noop,
                    onError: noop,
                    children: text,
                });

                return loadSendIcons({ abortController, checkForError: false });
            }
            const contactsKeyPinning = results
                .filter(isTruthy)
                .filter(({ error: { type } }) => type === ENCRYPTION_PREFERENCES_ERROR_TYPES.PRIMARY_NOT_PINNED)
                .map(({ contact }) => contact);
            if (contactsKeyPinning.length) {
                await handleShowAskForKeyPinningModal({
                    contacts: contactsKeyPinning,
                    onNotTrust: noop,
                    onError: noop,
                });

                return loadSendIcons({ abortController, checkForError: false });
            }
        };

        void loadSendIcons({ abortController, checkForError: true });

        return () => {
            abortController.abort();
        };
    }, [ktActivation]);

    return { handleRemove, askForKeyPinningModal, contactResignModal };
};

const getUpdatedSendInfo = async (
    emailAddress: string,
    message: MessageState,
    setMapSendInfo: Dispatch<SetStateAction<MapSendInfo>>,
    getEncryptionPreferences: GetEncryptionPreferences,
    ktActivation: KeyTransparencyActivation,
    contactsMap: ContactsMap
) => {
    const encryptionPreferences = await getEncryptionPreferences({
        email: emailAddress,
        lifetime: 0,
        contactEmailsMap: contactsMap,
    });
    const sendPreferences = getSendPreferences(encryptionPreferences, message.data);
    const sendIcon = getSendStatusIcon(sendPreferences);
    const contactSignatureInfo = {
        isVerified: encryptionPreferences.isContactSignatureVerified,
        creationTime: encryptionPreferences.contactSignatureTimestamp,
    };
    const updatedSendInfo = {
        sendPreferences,
        sendIcon,
        loading: false,
        emailAddressWarnings: encryptionPreferences.emailAddressWarnings || [],
        contactSignatureInfo,
    };
    setMapSendInfo((mapSendInfo) => {
        const sendInfo = mapSendInfo[emailAddress];
        if (!sendInfo) {
            return { ...mapSendInfo };
        }
        return {
            ...mapSendInfo,
            [emailAddress]: { ...sendInfo, ...updatedSendInfo },
        };
    });
};

export const useReloadSendInfo = () => {
    const getEncryptionPreferences = useGetEncryptionPreferences();
    const contactsMap = useContactsMap();
    const { ktActivation } = useKeyTransparencyContext();

    return useCallback(
        async (messageSendInfo: MessageSendInfo | undefined, message: MessageState) => {
            const { mapSendInfo, setMapSendInfo } = messageSendInfo || {};

            if (mapSendInfo === undefined || !setMapSendInfo || !message.data) {
                return;
            }

            const recipients = getRecipientsAddresses(message.data);
            const requests = recipients.map(
                (emailAddress) => () =>
                    getUpdatedSendInfo(
                        emailAddress,
                        message,
                        setMapSendInfo,
                        getEncryptionPreferences,
                        ktActivation,
                        contactsMap
                    )
            );
            const loadingMapSendInfo = recipients.reduce(
                (acc, emailAddress) => {
                    const sendInfo = acc[emailAddress] || { emailValidation: validateEmailAddress(emailAddress) };
                    acc[emailAddress] = { ...sendInfo, loading: true };
                    return acc;
                },
                { ...mapSendInfo }
            );
            setMapSendInfo(loadingMapSendInfo);
            // the routes called in requests support 100 calls every 10 seconds
            await processApiRequestsSafe(requests, 100, 10 * 1000);
        },
        [getEncryptionPreferences, contactsMap, ktActivation]
    );
};
