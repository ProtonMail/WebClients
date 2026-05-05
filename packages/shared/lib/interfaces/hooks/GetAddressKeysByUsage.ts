import type { PrivateKeyReference } from '@protontech/crypto';

import type { PrimaryAddressKeyForEncryption, PrimaryAddressKeysForSigning } from '@proton/shared/lib/keys';

export interface GetAddressKeysByUsageOptions {
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

export interface AddressKeysByUsage {
    decryptionKeys: PrivateKeyReference[];
    encryptionKey: PrimaryAddressKeyForEncryption;
    signingKeys: PrimaryAddressKeysForSigning;
    // verificationKeys can be added if there is a use-case for them
}

export type GetAddressKeysByUsage = (options: GetAddressKeysByUsageOptions) => Promise<AddressKeysByUsage>;
export type UseGetAddressKeysByUsage = () => GetAddressKeysByUsage;
