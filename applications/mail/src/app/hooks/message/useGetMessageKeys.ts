import { useCallback } from 'react';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import {
    getActiveAddressKeys,
    getPrimaryActiveAddressKeyForEncryption,
    getPrimaryAddressKeysForSigning,
} from '@proton/shared/lib/keys';

import type { PublicPrivateKey } from '../../store/messages/messagesTypes';

export type GetMessageKeys = (message: Pick<Message, 'AddressID'>) => Promise<PublicPrivateKey>;
export type UseGetMessageKeys = () => GetMessageKeys;

export const useGetMessageKeys: UseGetMessageKeys = () => {
    const getAddressKeys = useGetAddressKeys();

    return useCallback(
        async ({ AddressID }: Pick<Message, 'AddressID'>) => {
            const decryptedKeys = await getAddressKeys(AddressID);
            const activeKeysByVersion = await getActiveAddressKeys(null, decryptedKeys);
            const signingKeys = getPrimaryAddressKeysForSigning(activeKeysByVersion, true);
            const encryptionKey = getPrimaryActiveAddressKeyForEncryption(activeKeysByVersion, true).privateKey;
            // on decryption, key version order does not matter
            const decryptionKeys = [...activeKeysByVersion.v6, ...activeKeysByVersion.v4].map(
                (activeKey) => activeKey.privateKey
            );

            // verificationKeys are meant to be retrieved through useGetVerificationPreferences
            return {
                encryptionKeys: [encryptionKey],
                signingKeys,
                decryptionKeys,
                type: 'publicPrivate',
            };
        },
        [getAddressKeys]
    );
};
