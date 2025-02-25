import { useCallback } from 'react';

import { useGetAddressKeysByUsage } from '@proton/components/hooks/useGetAddressKeysByUsage';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';

import type { PublicPrivateKey } from '../../store/messages/messagesTypes';

export type GetMessageKeys = (message: Pick<Message, 'AddressID'>) => Promise<PublicPrivateKey>;
export type UseGetMessageKeys = () => GetMessageKeys;

export const useGetMessageKeys: UseGetMessageKeys = () => {
    const getAddressKeysByUsage = useGetAddressKeysByUsage();

    return useCallback(
        async ({ AddressID }: Pick<Message, 'AddressID'>) => {
            const { encryptionKey, signingKeys, decryptionKeys } = await getAddressKeysByUsage({
                AddressID,
                withV6Support: true,
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
