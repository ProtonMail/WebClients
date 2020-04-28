import { useCallback } from 'react';
import { OpenPGPKey } from 'pmcrypto';
import { useGetUserKeys } from 'react-components';
import { splitKeys } from 'proton-shared/lib/keys/keys';

import { MessageExtended } from '../models/message';

type UseMessageKeys = () => (
    message: MessageExtended
) => Promise<{ publicKeys: OpenPGPKey[]; privateKeys: OpenPGPKey[] }>;

/**
 * Add user public and private keys to the MessageExtended if not already there
 */
export const useMessageKeys: UseMessageKeys = () => {
    const getUserKeys = useGetUserKeys();

    return useCallback(
        async ({ publicKeys: existingPublicKeys, privateKeys: existingPrivateKeys }: MessageExtended) => {
            if (existingPublicKeys !== undefined && existingPrivateKeys !== undefined) {
                return { publicKeys: existingPublicKeys, privateKeys: existingPrivateKeys };
            }
            return splitKeys(await getUserKeys());
        },
        [getUserKeys]
    );
};
