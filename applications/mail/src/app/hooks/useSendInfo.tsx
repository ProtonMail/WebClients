import React, { useState, Dispatch, SetStateAction, useEffect } from 'react';
import { OpenPGPKey } from 'pmcrypto';
import { useGetEncryptionPreferences, useModals, useLoading } from 'react-components';
import { EncryptionPreferencesFailureTypes } from 'proton-shared/lib/mail/encryptionPreferences';
import { ContactEmail, ContactWithBePinnedPublicKey } from 'proton-shared/lib/interfaces/contacts';
import { processApiRequestsSafe } from 'proton-shared/lib/api/helpers/safeApiRequests';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
import { noop } from 'proton-shared/lib/helpers/function';
import { omit } from 'proton-shared/lib/helpers/object';

import { MapSendInfo } from '../models/crypto';
import { MessageExtended } from '../models/message';
import { validateEmailAddress } from 'proton-shared/lib/helpers/string';
import getSendPreferences from '../helpers/message/getSendPreferences';
import { Recipient } from '../models/address';
import AskForKeyPinningModal from '../components/composer/addresses/AskForKeyPinningModal';
import { getSendStatusIcon } from '../helpers/message/icon';
import { RequireSome } from '../models/utils';

const { INTERNAL_USER_PRIMARY_NOT_PINNED, WKD_USER_PRIMARY_NOT_PINNED } = EncryptionPreferencesFailureTypes;
const primaryKeyNotPinnedFailureTypes = [INTERNAL_USER_PRIMARY_NOT_PINNED, WKD_USER_PRIMARY_NOT_PINNED] as any[];

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
    recipient: Required<Pick<Recipient, 'Address' | 'ContactID'>>,
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
            if (primaryKeyNotPinnedFailureTypes.includes(sendPreferences.failure?.type)) {
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
                            onSubmit={resolve}
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
    abortController: AbortController;
    checkForFailure: boolean;
}

export type MapLoading = { [key: string]: boolean | undefined };

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

        const loadSendIcon = async ({ emailAddress, contactID, abortController, checkForFailure }: LoadParams) => {
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
            if (checkForFailure && primaryKeyNotPinnedFailureTypes.includes(sendPreferences.failure?.type)) {
                return {
                    contactID,
                    emailAddress,
                    isInternal: encryptionPreferences.isInternal,
                    bePinnedPublicKey: encryptionPreferences.sendKey as OpenPGPKey
                };
            }
            return;
        };

        const loadSendIcons = async ({
            abortController,
            checkForFailure
        }: Pick<LoadParams, 'abortController' | 'checkForFailure'>): Promise<void> => {
            const requests = contacts.map(({ Email, ContactID }) => () =>
                loadSendIcon({ emailAddress: Email, contactID: ContactID, abortController, checkForFailure })
            );
            // the routes called in requests support 100 calls every 10 seconds
            const contactsKeyPinning: RequireSome<ContactWithBePinnedPublicKey, 'contactID'>[] = (
                await processApiRequestsSafe(requests, 100, 10 * 1000)
            ).filter(isTruthy);
            if (contactsKeyPinning.length) {
                await new Promise((resolve) => {
                    createModal(
                        <AskForKeyPinningModal
                            contacts={contactsKeyPinning}
                            onSubmit={resolve}
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
