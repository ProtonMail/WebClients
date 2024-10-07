import { useCallback } from 'react';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { splitKeys } from '@proton/shared/lib/keys/keys';

import type { PublicPrivateKey } from '../../store/messages/messagesTypes';

export type GetMessageKeys = (message: Pick<Message, 'AddressID'>) => Promise<PublicPrivateKey>;
export type UseGetMessageKeys = () => GetMessageKeys;

/**
 * Add user public and private keys to the MessageExtended if not already there
 */
export const useGetMessageKeys: UseGetMessageKeys = () => {
    const getAddressKeys = useGetAddressKeys();

    return useCallback(
        async (message: Pick<Message, 'AddressID'>) => {
            const { publicKeys, privateKeys } = splitKeys(await getAddressKeys(message.AddressID));
            return { publicKeys, privateKeys, type: 'publicPrivate' };
        },
        [getAddressKeys]
    );
};
