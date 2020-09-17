import { useCallback } from 'react';
import { OpenPGPKey } from 'pmcrypto';
import { useGetAddressKeys } from 'react-components';
import { splitKeys } from 'proton-shared/lib/keys/keys';

import { MessageExtendedWithData } from '../../models/message';

type UseMessageKeys = () => (
    message: MessageExtendedWithData,
    forceRefresh?: boolean
) => Promise<{ publicKeys: OpenPGPKey[]; privateKeys: OpenPGPKey[] }>;

/**
 * Add user public and private keys to the MessageExtended if not already there
 */
export const useMessageKeys: UseMessageKeys = () => {
    const getAddressKeys = useGetAddressKeys();

    return useCallback(
        async (message?: MessageExtendedWithData) => {
            const { publicKeys, privateKeys } = splitKeys(await getAddressKeys(message?.data.AddressID || ''));
            return { publicKeys, privateKeys };
        },
        [getAddressKeys]
    );
};
