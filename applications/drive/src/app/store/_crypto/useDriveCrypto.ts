import { useCallback } from 'react';

import { c } from 'ttag';

import { useAuthentication, useGetAddressKeys, useGetAddresses, useNotifications } from '@proton/components';
import { PrivateKeyReference } from '@proton/crypto';
import { ADDRESS_STATUS } from '@proton/shared/lib/constants';
import { Address } from '@proton/shared/lib/interfaces/Address';
import { sign as signMessage } from '@proton/shared/lib/keys/driveKeys';

import { ShareWithKey } from '../_shares';
import {
    decryptSharePassphraseAsync,
    getOwnAddressAndPrimaryKeysAsync,
    getOwnAddressKeysAsync,
    getPrimaryAddressAsync,
    getPrimaryAddressKeyAsync,
} from './driveCrypto';

// Special case for drive to allow users with just an external address
export const getActiveAddresses = (addresses: Address[]): Address[] => {
    return addresses.filter(({ Status }) => Status === ADDRESS_STATUS.STATUS_ENABLED);
};

function useDriveCrypto() {
    const { createNotification } = useNotifications();
    const getAddressKeys = useGetAddressKeys();
    const getAddresses = useGetAddresses();
    const { UID } = useAuthentication();

    const getPrimaryAddress = useCallback(async () => {
        return getPrimaryAddressAsync(getAddresses).catch((error) => {
            createNotification({ text: c('Error').t`No valid address found`, type: 'error' });
            throw error;
        });
    }, [getAddresses]);

    // getPrimaryAddressKey returns only currently primary key of the primary
    // address. Used for bootstrapping.
    const getPrimaryAddressKey = useCallback(async () => {
        return getPrimaryAddressKeyAsync(getPrimaryAddress, getAddressKeys);
    }, [getPrimaryAddress, getAddressKeys]);

    const getOwnAddressKeys = useCallback(
        async (email: string) => getOwnAddressKeysAsync(email, getAddresses, getAddressKeys),
        [getAddresses, getAddressKeys]
    );

    // This should be used for encryption and signing of any content.
    const getOwnAddressAndPrimaryKeys = useCallback(
        async (email: string) => getOwnAddressAndPrimaryKeysAsync(email, getAddresses, getAddressKeys),
        [getAddresses, getAddressKeys]
    );

    const getPrivateAddressKeys = useCallback(
        async (email: string) => {
            const result = await getOwnAddressKeysAsync(email, getAddresses, getAddressKeys);
            return result?.privateKeys || [];
        },
        [getAddresses, getAddressKeys]
    );

    const getVerificationKey = useCallback(
        async (email?: string) => {
            // If UID is empty, it means user is not logged in.
            // We don't support checking signatures for public session yet
            // so lets simply return no keys instead of firing exceptions.
            if (!email || !UID) {
                return [];
            }
            const result = await getOwnAddressKeysAsync(email, getAddresses, getAddressKeys);
            return result?.publicKeys || [];
        },
        [getAddresses, getAddressKeys]
    );

    const sign = useCallback(
        async (payload: string | Uint8Array, keys?: { privateKey: PrivateKeyReference; address: Address }) => {
            const { privateKey, address } = keys || (await getPrimaryAddressKey());
            const signature = await signMessage(payload, [privateKey]);
            return { signature, address };
        },
        [getPrimaryAddressKey]
    );

    /**
     * Decrypts share passphrase. By default decrypts with the same user's keys who encrypted.
     * Keys can be passed explicitly if user is different, i.e. in case of sharing between users.
     * @param meta share metadata
     * @param privateKeys keys to use, when the user is not the same who encrypted
     */
    const decryptSharePassphrase = async (meta: ShareWithKey, privateKeys?: PrivateKeyReference[]) => {
        if (!privateKeys) {
            const keys = await getOwnAddressKeys(meta.creator);
            if (!keys) {
                throw new Error('Address key was not found');
            }
            privateKeys = keys.privateKeys;
        }
        return decryptSharePassphraseAsync(meta, privateKeys, getVerificationKey);
    };

    return {
        getPrimaryAddressKey,
        getOwnAddressAndPrimaryKeys,
        getPrivateAddressKeys,
        getVerificationKey,
        getPrimaryAddress,
        sign,
        decryptSharePassphrase,
    };
}

export default useDriveCrypto;
