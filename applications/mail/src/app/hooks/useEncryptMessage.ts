import { useCallback } from 'react';
import { useGetPublicKeys, useGetAddressKeys } from 'react-components';
import { splitKeys } from 'proton-shared/lib/keys/keys';

import { encryptBody } from '../helpers/message/messageEncrypt';
import { MessageExtended } from '../models/message';

export const useEncryptMessage = () => {
    const getPublicKeys = useGetPublicKeys();
    const getAddressKeys = useGetAddressKeys();

    // TODO: Cache result
    return useCallback(
        async (message: MessageExtended): Promise<MessageExtended> => {
            const [{ publicKeys = [] }, addressKeys] = await Promise.all([
                getPublicKeys(message.data?.Sender?.Address),
                getAddressKeys(message.data?.AddressID)
            ]);
            const { privateKeys } = splitKeys(addressKeys) as any;

            return encryptBody(message, privateKeys, publicKeys);
        },
        [getPublicKeys, getAddressKeys]
    );
};
