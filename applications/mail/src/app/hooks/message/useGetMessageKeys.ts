import { useCallback } from 'react';
import { useGetAddressKeys } from 'react-components';
import { splitKeys } from 'proton-shared/lib/keys/keys';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { MessageKeys } from '../../models/message';

export type GetMessageKeys = (message: Pick<Message, 'AddressID'>) => Promise<MessageKeys>;
export type UseGetMessageKeys = () => GetMessageKeys;

/**
 * Add user public and private keys to the MessageExtended if not already there
 */
export const useGetMessageKeys: UseGetMessageKeys = () => {
    const getAddressKeys = useGetAddressKeys();

    return useCallback(
        async (message: Pick<Message, 'AddressID'>) => {
            const { publicKeys, privateKeys } = splitKeys(await getAddressKeys(message.AddressID));
            return { publicKeys, privateKeys };
        },
        [getAddressKeys]
    );
};
