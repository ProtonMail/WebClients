import { useCallback } from 'react';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import type { PrivateKeyReference } from '@proton/crypto';
import type { PrimaryAddressKeyForEncryption, PrimaryAddressKeysForSigning } from '@proton/shared/lib/keys';
import {
    getActiveAddressKeys,
    getPrimaryActiveAddressKeyForEncryption,
    getPrimaryAddressKeysForSigning,
} from '@proton/shared/lib/keys';

interface GetAddressKeysByUsageOptions {
    AddressID: string;
    /**
     * If true, the hook enables encrypting to the v6/PQC primary address key
     * whenever available, and signing using both v4 and v6 primary keys.
     * NB: this behaviour may not be backwards compatible with all features and/or across apps.
     */
    withV6SupportForEncryption: boolean;
    /**
     * If true, the hook enables signing using both v4 and v6 primary keys whenever available.
     * NB: this behaviour may not be backwards compatible with all features and/or across apps.
     */
    withV6SupportForSigning: boolean;
}
export type GetAddressKeysByUsage = (options: GetAddressKeysByUsageOptions) => Promise<AddressKeysByUsage>;
export type UseGetAddressKeysByUsage = () => GetAddressKeysByUsage;

export interface AddressKeysByUsage {
    decryptionKeys: PrivateKeyReference[];
    encryptionKey: PrimaryAddressKeyForEncryption;
    signingKeys: PrimaryAddressKeysForSigning;
    // verificationKeys can be added if there is a use-case for them
}

/**
 * Get address keys divided by usage, with optional v6/PQC key support.
 */
export const useGetAddressKeysByUsage: UseGetAddressKeysByUsage = () => {
    const getAddressKeys = useGetAddressKeys();
    return useCallback(
        async ({
            AddressID,
            withV6SupportForEncryption = false,
            withV6SupportForSigning = false,
        }: GetAddressKeysByUsageOptions) => {
            const decryptedKeys = await getAddressKeys(AddressID);
            const activeKeysByVersion = await getActiveAddressKeys(null, decryptedKeys);
            const signingKeys = getPrimaryAddressKeysForSigning(activeKeysByVersion, withV6SupportForSigning);
            const encryptionKey = getPrimaryActiveAddressKeyForEncryption(
                activeKeysByVersion,
                withV6SupportForEncryption
            ).privateKey;
            // on decryption, key version order does not matter
            const decryptionKeys = [...activeKeysByVersion.v6, ...activeKeysByVersion.v4].map(
                (activeKey) => activeKey.privateKey
            );

            return {
                encryptionKey,
                signingKeys,
                decryptionKeys,
            };
        },
        [getAddressKeys]
    );
};
