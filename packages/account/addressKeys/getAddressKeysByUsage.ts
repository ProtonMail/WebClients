import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { PrivateKeyReference } from '@proton/crypto';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type {
    GetAddressKeysByUsage,
    GetAddressKeysByUsageOptions,
    UseGetAddressKeysByUsage,
} from '@proton/shared/lib/interfaces/hooks/GetAddressKeysByUsage';
import {
    type PrimaryAddressKeyForEncryption,
    type PrimaryAddressKeysForSigning,
    getActiveAddressKeys,
    getPrimaryActiveAddressKeyForEncryption,
    getPrimaryAddressKeysForSigning,
} from '@proton/shared/lib/keys';

import type { KtState } from '../kt';
import { type AddressKeysState, addressKeysThunk } from './index';

export type { GetAddressKeysByUsage, UseGetAddressKeysByUsage };

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
