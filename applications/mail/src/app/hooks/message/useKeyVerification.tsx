import { KeyId } from '@proton/shared/lib/contacts/keyVerifications';
import { useAddresses, useNotifications } from '@proton/components';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';
import * as React from 'react';
import DecryptionErrorNotification from '../../components/notifications/DecryptionErrorNotification';
import { MessageExtendedWithData } from '../../models/message';
import { getMessageDecryptionKeyFromAddress } from '../../helpers/message/messageDecrypt';

export const useKeyVerification = () => {
    const { createNotification, hideNotification } = useNotifications();
    const [addresses] = useAddresses();

    /**
     * Try to find the key responsible for message encryption and display a notification to the user
     * If we find the key, and there is a decryption error, it means that the key is disabled, and that the password has been reset
     * The notification is displayed once per key and per browser, so that for every password change we display a notification, without spamming the user
     */
    const verifyKeys = async (message: MessageExtendedWithData) => {
        const address = addresses.find((address) => address.ID === message.data.AddressID);

        if (!address) {
            return;
        }

        // Get the key used to encrypt the message
        const { matchingKey } = await getMessageDecryptionKeyFromAddress(address, message);

        if (matchingKey) {
            const encounteredDecryptionErrorKeys = getItem('DecryptionErrorEncounteredKeys');
            const encounteredDecryptionErrorKeysArray = encounteredDecryptionErrorKeys
                ? JSON.parse(encounteredDecryptionErrorKeys)
                : [];

            // If the key is not already in the localStorage, we display a notification
            if (
                !encounteredDecryptionErrorKeysArray.some((encounteredKey: KeyId) => matchingKey.equals(encounteredKey))
            ) {
                const notification = createNotification({
                    text: <DecryptionErrorNotification onDiscard={() => hideNotification(notification)} keyFound />,
                    type: 'error',
                    expiration: -1,
                    disableAutoClose: true,
                });

                const updatedEncounteredKeys = JSON.stringify([...encounteredDecryptionErrorKeysArray, matchingKey]);
                setItem('DecryptionErrorEncounteredKeys', updatedEncounteredKeys);
            }
        } else {
            const notification = createNotification({
                text: <DecryptionErrorNotification onDiscard={() => hideNotification(notification)} />,
                type: 'error',
                expiration: -1,
                disableAutoClose: true,
            });
        }
    };

    return { verifyKeys };
};
