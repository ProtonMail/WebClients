import { useCallback } from 'react';

import { useGetAddressKeysByUsage } from '@proton/components/hooks/useGetAddressKeysByUsage';
import type { PublicPrivateKey } from '@proton/mail/store/messages/messagesTypes';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

export type GetMessageKeys = (message: Pick<Message, 'AddressID'>) => Promise<PublicPrivateKey>;
export type UseGetMessageKeys = () => GetMessageKeys;

export const useGetMessageKeys: UseGetMessageKeys = () => {
    const getAddressKeysByUsage = useGetAddressKeysByUsage();

    return useCallback(
        async ({ AddressID }: Pick<Message, 'AddressID'>) => {
            const { encryptionKey, signingKeys, decryptionKeys } = await getAddressKeysByUsage({
                AddressID,
                withV6SupportForEncryption: true,
                // only sign with v4 keys for now, since presence of v6 signatures breaks parsing for some
                // third-party OpenPGP libs (e.g. RNP), as well as older gopenpgp versions
                withV6SupportForSigning: false,
            });

            // verificationKeys are meant to be retrieved through useGetVerificationPreferences
            return {
                encryptionKey,
                signingKeys,
                decryptionKeys,
                type: 'publicPrivate',
            };
        },
        [getAddressKeysByUsage]
    );
};
