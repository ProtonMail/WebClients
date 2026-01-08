import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useNotifications } from '@proton/components';
import type { KeyID } from '@proton/crypto';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { getItem, setItem } from '@proton/shared/lib/helpers/storage';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';

import DecryptionErrorNotification from '../../components/notifications/DecryptionErrorNotification';
import { getMessageDecryptionKeyInfoFromAddress } from '../../helpers/message/messageDecrypt';

const getIsExternalMessageWithE2EE = (message: Message) =>
    hasBit(message.Flags, MESSAGE_FLAGS.FLAG_E2E) && !hasBit(message.Flags, MESSAGE_FLAGS.FLAG_INTERNAL);

export const useMessageDecryptionErrorNotification = () => {
    const { createNotification } = useNotifications();
    const getAddresses = useGetAddresses();

    /**
     * Try to find the key responsible for message encryption and display a notification to the user
     * If we find the key, and there is a decryption error, it means that the key is disabled, and that the password has been reset
     * The notification is displayed once per key and per browser, so that for every password change we display a notification, without spamming the user
     */
    const maybeCreateNotificationForDecryptionError = async (message: Message) => {
        const addresses = await getAddresses();
        const address = addresses.find((address) => address.ID === message.AddressID);

        if (!address) {
            return;
        }

        // Get the address key the message is encrypted to
        const decryptionKeyInfo = await getMessageDecryptionKeyInfoFromAddress(address, message);

        if (decryptionKeyInfo) {
            const encounteredDecryptionErrorKeys = getItem('DecryptionErrorEncounteredKeys');
            const encounteredDecryptionErrorKeysArray = encounteredDecryptionErrorKeys
                ? JSON.parse(encounteredDecryptionErrorKeys)
                : [];

            // If the key is not already in the localStorage, we display a notification
            if (
                !encounteredDecryptionErrorKeysArray.some(
                    (encounteredKey: KeyID) => decryptionKeyInfo.keyID === encounteredKey
                )
            ) {
                createNotification({
                    text: (
                        <DecryptionErrorNotification
                            decryptionKeyInfo={decryptionKeyInfo}
                            isExternalMessageWithE2EE={getIsExternalMessageWithE2EE(message)}
                        />
                    ),
                    type: 'error',
                    expiration: -1,
                    showCloseButton: true,
                });

                const updatedEncounteredKeys = JSON.stringify([
                    ...encounteredDecryptionErrorKeysArray,
                    decryptionKeyInfo.keyID,
                ]);
                setItem('DecryptionErrorEncounteredKeys', updatedEncounteredKeys);
            }
        } else {
            createNotification({
                text: (
                    <DecryptionErrorNotification
                        decryptionKeyInfo={null}
                        isExternalMessageWithE2EE={getIsExternalMessageWithE2EE(message)}
                    />
                ),
                type: 'error',
                expiration: -1,
                showCloseButton: true,
            });
        }
    };

    return { maybeCreateNotificationForDecryptionError };
};
