import { useCallback } from 'react';
import { OpenPGPKey } from 'pmcrypto';
import { useGetAddressKeys, useGetUserKeys } from 'react-components';
import { splitKeys } from 'proton-shared/lib/keys/keys';

import { MessageExtendedWithData } from '../models/message';

type UseMessageKeys = () => (
    message: MessageExtendedWithData
) => Promise<{ publicKeys: OpenPGPKey[]; privateKeys: OpenPGPKey[] }>;

/**
 * Add user public and private keys to the MessageExtended if not already there
 */
export const useMessageKeys: UseMessageKeys = () => {
    const getUserKeys = useGetUserKeys();
    const getAddressKeys = useGetAddressKeys();

    return useCallback(
        async ({
            data: message,
            publicKeys: existingPublicKeys,
            privateKeys: existingPrivateKeys
        }: MessageExtendedWithData) => {
            if (existingPublicKeys !== undefined && existingPrivateKeys !== undefined) {
                return { publicKeys: existingPublicKeys, privateKeys: existingPrivateKeys };
            }
            const { publicKeys } = splitKeys(await getUserKeys());
            const { privateKeys } = splitKeys(await getAddressKeys(message.AddressID || ''));
            return { publicKeys, privateKeys };
        },
        [getUserKeys, getAddressKeys]
    );
};
