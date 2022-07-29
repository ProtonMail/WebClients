import { useCallback } from 'react';

import { useGetAddressKeys } from '@proton/components';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { splitKeys } from '@proton/shared/lib/keys/keys';

import { PublicPrivateKey } from '../../logic/messages/messagesTypes';

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
