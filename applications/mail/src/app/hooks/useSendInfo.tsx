import { OpenPGPKey } from 'pmcrypto';
import { processApiRequestsSafe } from 'proton-shared/lib/api/helpers/safeApiRequests';
import { noop } from 'proton-shared/lib/helpers/function';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { omit } from 'proton-shared/lib/helpers/object';
import { validateEmailAddress } from 'proton-shared/lib/helpers/string';
import { ContactEmail } from 'proton-shared/lib/interfaces/contacts';
import { EncryptionPreferencesFailureTypes } from 'proton-shared/lib/mail/encryptionPreferences';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Alert, useGetEncryptionPreferences, useLoading, useModals } from 'react-components';
import { c, msgid } from 'ttag';
import AskForKeyPinningModal from '../components/composer/addresses/AskForKeyPinningModal';
import ContactResignModal from '../components/message/modals/ContactResignModal';
import getSendPreferences from '../helpers/message/getSendPreferences';
import { getSendStatusIcon } from '../helpers/message/icon';
import { Recipient } from '../models/address';

import { MapSendInfo } from '../models/crypto';
import { MessageExtended } from '../models/message';
import { MapLoading, RequireSome } from '../models/utils';

const { PRIMARY_NOT_PINNED, CONTACT_SIGNATURE_NOT_VERIFIED } = EncryptionPreferencesFailureTypes;

export interface MessageSendInfo {
    message: MessageExtended;
    mapSendInfo: MapSendInfo;
    setMapSendInfo: Dispatch<SetStateAction<MapSendInfo>>;
}

export const useMessageSendInfo = (message: MessageExtended) => {
    // Map of send preferences and send icons for each recipient
    const [mapSendInfo, setMapSendInfo] = useState<MapSendInfo>({});

    const messageSendInfo: MessageSendInfo = { message, mapSendInfo, setMapSendInfo };

    return messageSendInfo;
};

export const useUpdateRecipientSendInfo = (
    messageSendInfo: MessageSendInfo | undefined,
    recipient: RequireSome<Recipient, 'Address' | 'ContactID'>,
    onRemove: () => void
) => {
    const emailAddress = recipient.Address;
    const sendInfo = messageSendInfo?.mapSendInfo[emailAddress];
    const icon = sendInfo?.sendIcon;

    const { createModal } = useModals();
    const [loading, withLoading] = useLoading(!icon);
    const getEncryptionPreferences = useGetEncryptionPreferences();

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
                        sendPreferences: undefined,
                        sendIcon: undefined,
                        emailValidation,
                        emailAddressWarnings: []
                    }
                }));
                return;
            }

            const encryptionPreferences = await getEncryptionPreferences(emailAddress);
            const sendPreferences = getSendPreferences(encryptionPreferences, message.data);

            if (sendPreferences.failure?.type === CONTACT_SIGNATURE_NOT_VERIFIED) {
                await new Promise((resolve, reject) => {
                    const contact = { contactID: recipient.ContactID };
                    const contactAddress = recipient.Address;
                    const contactName = recipient.Name || contactAddress;
                    createModal(
                        <ContactResignModal
                            title={c('Title').t`Re-sign contact`}
                            contacts={[contact]}
                            onResign={resolve}
                            onClose={reject}
                            onNotResign={handleRemove}
                            onError={handleRemove}
                        >
                            <Alert type="error">
                                {c('Info')
                                    .t`The verification of ${contactName} has failed: the contact is not signed correctly.
                                    This may be the result of a password reset.
                                    You must re-sign the contact in order to send a message to ${contactAddress} or edit the contact.`}
                            </Alert>
                        </ContactResignModal>
                    );
                });
                return await updateRecipientIcon();
            }

            if (sendPreferences.failure?.type === PRIMARY_NOT_PINNED) {
                await new Promise((resolve, reject) => {
                    const contacts = [
                        {
                            contactID: recipient.ContactID,
                            emailAddress,
                            isInternal: encryptionPreferences.isInternal,
                            bePinnedPublicKey: encryptionPreferences.sendKey as OpenPGPKey
                        }
                    ];
                    createModal(
                        <AskForKeyPinningModal
                            contacts={contacts}
                            onTrust={resolve}
                            onClose={reject}
                            onNotTrust={handleRemove}
                            onError={handleRemove}
                        />
                    );
                });
                return await updateRecipientIcon();
            }
            const sendIcon = getSendStatusIcon(sendPreferences);

            setMapSendInfo((mapSendInfo) => ({
                ...mapSendInfo,
                [emailAddress]: {
                    sendPreferences,
                    sendIcon,
                    emailValidation,
                    emailAddressWarnings: encryptionPreferences.emailAddressWarnings || []
                }
            }));
        };

        withLoading(updateRecipientIcon());
    }, [emailAddress]);

    return { loading, handleRemove };
};

interface LoadParams {
    emailAddress: string;
    contactID: string;
    contactName: string;
    abortController: AbortController;
    checkForFailure: boolean;
}

export const useUpdateGroupSendInfo = (
    messageSendInfo: MessageSendInfo | undefined,
    contacts: ContactEmail[],
    onRemove: () => void
) => {
    const getEncryptionPreferences = useGetEncryptionPreferences();
    const { createModal } = useModals();

    const [mapLoading, setMapLoading] = useState<MapLoading>(() =>
        contacts.reduce<MapLoading>((acc, { Email }) => {
            acc[Email] = !messageSendInfo?.mapSendInfo[Email]?.sendPreferences;
            return acc;
        }, {})
    );

    const emailsInGroup = contacts.map(({ Email }) => Email);

    const handleRemove = () => {
        if (messageSendInfo) {
            const { setMapSendInfo } = messageSendInfo;
            setMapSendInfo((mapSendInfo) => omit(mapSendInfo, emailsInGroup));
        }
        onRemove();
    };

    useEffect(() => {
        const abortController = new AbortController();
        // loadSendIcon tries to load the corresponding icon for an email address. If all goes well, it returns nothing.
        // If there are errors, it returns an error type and information about the email address that failed
        const loadSendIcon = async ({
            emailAddress,
            contactID,
            contactName,
            abortController,
            checkForFailure
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
            const encryptionPreferences = await getEncryptionPreferences(emailAddress);
            const sendPreferences = getSendPreferences(encryptionPreferences, message.data);
            const sendIcon = getSendStatusIcon(sendPreferences);
            !signal.aborted &&
                setMapSendInfo((mapSendInfo) => ({
                    ...mapSendInfo,
                    [emailAddress]: {
                        sendPreferences,
                        sendIcon,
                        emailValidation,
                        emailAddressWarnings: encryptionPreferences.emailAddressWarnings || []
                    }
                }));
            !signal.aborted && setMapLoading((loadingMap) => ({ ...loadingMap, [emailAddress]: false }));
            if (checkForFailure && sendPreferences.failure) {
                return {
                    failure: sendPreferences.failure,
                    contact: {
                        contactID,
                        contactName,
                        emailAddress,
                        isInternal: encryptionPreferences.isInternal,
                        bePinnedPublicKey: encryptionPreferences.sendKey as OpenPGPKey
                    }
                };
            }
            return;
        };

        const loadSendIcons = async ({
            abortController,
            checkForFailure
        }: Pick<LoadParams, 'abortController' | 'checkForFailure'>): Promise<void> => {
            const requests = contacts.map(({ Email, ContactID, Name }) => () =>
                loadSendIcon({
                    emailAddress: Email,
                    contactID: ContactID,
                    contactName: Name,
                    abortController,
                    checkForFailure
                })
            );
            // the routes called in requests support 100 calls every 10 seconds
            const results = await processApiRequestsSafe(requests, 100, 10 * 1000);
            const contactsResign = results
                .filter(isTruthy)
                .filter(({ failure: { type } }) => type === CONTACT_SIGNATURE_NOT_VERIFIED)
                .map(({ contact }) => contact);
            const totalContactsResign = contactsResign.length;
            if (totalContactsResign) {
                await new Promise((resolve) => {
                    const title = c('Title').ngettext(msgid`Re-sign contact`, `Re-sign contacts`, totalContactsResign);
                    const contactNames = contactsResign.map(({ contactName }) => contactName).join(', ');
                    const contactAddresses = contactsResign.map(({ emailAddress }) => emailAddress).join(', ');
                    createModal(
                        <ContactResignModal
                            title={title}
                            contacts={contactsResign}
                            onResign={resolve}
                            onClose={resolve}
                            onNotResign={noop}
                            onError={noop}
                        >
                            <Alert type="error">
                                {c('Info').ngettext(
                                    msgid`The verification of ${contactNames} has failed: the contact is not signed correctly.
                                    This may be the result of a password reset.
                                    You must re-sign the contact in order to send a message to ${contactAddresses} or edit the contact.`,
                                    `The verification of ${contactNames} has failed: the contacts are not signed correctly.
                                    This may be the result of a password reset.
                                    You must re-sign the contacts in order to send a message to ${contactAddresses} or edit the contacts.`,
                                    totalContactsResign
                                )}
                            </Alert>
                        </ContactResignModal>
                    );
                });
                return await loadSendIcons({ abortController, checkForFailure: false });
            }
            const contactsKeyPinning = results
                .filter(isTruthy)
                .filter(({ failure: { type } }) => type === PRIMARY_NOT_PINNED)
                .map(({ contact }) => contact);
            if (contactsKeyPinning.length) {
                await new Promise((resolve) => {
                    createModal(
                        <AskForKeyPinningModal
                            contacts={contactsKeyPinning}
                            onTrust={resolve}
                            onClose={resolve}
                            onNotTrust={noop}
                            onError={noop}
                        />
                    );
                });
                return await loadSendIcons({ abortController, checkForFailure: false });
            }
        };
        loadSendIcons({ abortController, checkForFailure: true });

        return () => {
            abortController.abort();
        };
    }, []);

    return { mapLoading, handleRemove };
};
