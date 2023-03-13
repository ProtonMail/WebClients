import * as React from 'react';

import { useAddresses, useNotifications } from '@proton/components';
import type { KeyID } from '@proton/crypto';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import DecryptionErrorNotification from '../../components/notifications/DecryptionErrorNotification';
import { getMessageDecryptionKeyIDFromAddress } from '../../helpers/message/messageDecrypt';

export const useKeyVerification = () => {
    const { createNotification } = useNotifications();
    const [addresses] = useAddresses();

    /**
     * Try to find the key responsible for message encryption and display a notification to the user
     * If we find the key, and there is a decryption error, it means that the key is disabled, and that the password has been reset
     * The notification is displayed once per key and per browser, so that for every password change we display a notification, without spamming the user
     */
    const verifyKeys = async (message: Message) => {
        const address = addresses.find((address) => address.ID === message.AddressID);

        if (!address) {
            return;
        }

        // Get the key used to encrypt the message
        const matchingKeyID = await getMessageDecryptionKeyIDFromAddress(address, message);

        if (matchingKeyID) {
            const encounteredDecryptionErrorKeys = getItem('DecryptionErrorEncounteredKeys');
            const encounteredDecryptionErrorKeysArray = encounteredDecryptionErrorKeys
                ? JSON.parse(encounteredDecryptionErrorKeys)
                : [];

            // If the key is not already in the localStorage, we display a notification
            if (
                !encounteredDecryptionErrorKeysArray.some((encounteredKey: KeyID) => matchingKeyID === encounteredKey)
            ) {
                createNotification({
                    text: <DecryptionErrorNotification keyFound />,
                    type: 'error',
                    expiration: -1,
                    showCloseButton: true,
                });

                const updatedEncounteredKeys = JSON.stringify([...encounteredDecryptionErrorKeysArray, matchingKeyID]);
                setItem('DecryptionErrorEncounteredKeys', updatedEncounteredKeys);
            }
        } else {
            createNotification({
                text: <DecryptionErrorNotification />,
                type: 'error',
                expiration: -1,
                showCloseButton: true,
            });
        }
    };

    return { verifyKeys };
};
