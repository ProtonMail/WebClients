import { useCallback } from 'react';
import { useGetPublicKeys, useGetAddressKeys } from 'react-components';
import { splitKeys } from 'proton-shared/lib/keys/keys';
import { MessageExtended } from '../models/message';
import { Computation } from './useMessage';

/**
 * Add public and private keys to the MessageExtended if not already there
 */
export const useMessageKeys = (): Computation => {
    const getPublicKeys = useGetPublicKeys();
    const getAddressKeys = useGetAddressKeys();

    return useCallback(
        async ({
            data: message = {},
            publicKeys: existingPublicKeys,
            privateKeys: existingPrivateKeys
        }: MessageExtended): Promise<MessageExtended> => {
            if (existingPublicKeys !== undefined && existingPrivateKeys !== undefined) {
                return {};
            }

            const [{ publicKeys = [] }, addressKeys] = await Promise.all([
                getPublicKeys((message.Sender || {}).Address),
                getAddressKeys(message.AddressID || '')
            ]);
            const { privateKeys } = splitKeys(addressKeys) as any;

            return { publicKeys, privateKeys };
        },
        [getPublicKeys, getAddressKeys]
    );
};
