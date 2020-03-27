import { useCallback } from 'react';
import { OpenPGPKey } from 'pmcrypto';
import { useGetPublicKeys, useGetAddressKeys } from 'react-components';
import { splitKeys } from 'proton-shared/lib/keys/keys';

import { MessageExtended } from '../models/message';
import { CachedKey } from 'proton-shared/lib/interfaces';

type UseMessageKeys = () => (
    message: MessageExtended
) => Promise<{ publicKeys: OpenPGPKey[]; privateKeys: OpenPGPKey[] }>;

/**
 * Add public and private keys to the MessageExtended if not already there
 */
export const useMessageKeys: UseMessageKeys = () => {
    const getPublicKeys = useGetPublicKeys() as (email: string) => Promise<{ publicKeys: OpenPGPKey[] }>;
    const getAddressKeys = useGetAddressKeys() as (addressID: string) => Promise<CachedKey[]>;

    return useCallback(
        async ({
            data: message = {},
            publicKeys: existingPublicKeys,
            privateKeys: existingPrivateKeys
        }: MessageExtended) => {
            if (existingPublicKeys !== undefined && existingPrivateKeys !== undefined) {
                return { publicKeys: existingPublicKeys, privateKeys: existingPrivateKeys };
            }

            const [{ publicKeys = [] }, addressKeys] = await Promise.all([
                getPublicKeys((message.Sender || {}).Address || ''),
                getAddressKeys(message.AddressID || '')
            ]);
            const { privateKeys } = splitKeys(addressKeys) as any;

            return { publicKeys, privateKeys };
        },
        [getPublicKeys, getAddressKeys]
    );
};
