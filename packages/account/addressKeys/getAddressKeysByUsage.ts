import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { PrivateKeyReference } from '@proton/crypto';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import {
    type PrimaryAddressKeyForEncryption,
    type PrimaryAddressKeysForSigning,
    getActiveAddressKeys,
    getPrimaryActiveAddressKeyForEncryption,
    getPrimaryAddressKeysForSigning,
} from '@proton/shared/lib/keys';

import type { KtState } from '../kt';
import { type AddressKeysState, addressKeysThunk } from './index';

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

export const getAddressKeysByUsageThunk = ({
    withV6SupportForEncryption,
    withV6SupportForSigning,
    AddressID,
}: GetAddressKeysByUsageOptions): ThunkAction<
    Promise<AddressKeysByUsage>,
    AddressKeysState & KtState,
    ProtonThunkArguments,
    UnknownAction
> => {
    return async (dispatch, _) => {
        const decryptedKeys = await dispatch(addressKeysThunk({ addressID: AddressID }));
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
    };
};
