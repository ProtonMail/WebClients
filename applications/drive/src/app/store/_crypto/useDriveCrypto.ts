import { useCallback } from 'react';

import { c } from 'ttag';

import {
    useApi,
    useAuthentication,
    useGetAddressKeys,
    useGetAddresses,
    useGetUser,
    useNotifications,
} from '@proton/components';
import { CryptoProxy, PrivateKeyReference } from '@proton/crypto';
import { Address } from '@proton/shared/lib/interfaces/Address';
import { sign as signMessage } from '@proton/shared/lib/keys/driveKeys';

import { getPublicKeysForEmail } from '../../utils/getPublicKeysForEmail';
import { ShareWithKey } from '../_shares';
import {
    decryptSharePassphraseAsync,
    getOwnAddressAndPrimaryKeysAsync,
    getOwnAddressKeysAsync,
    getPrimaryAddressAsync,
    getPrimaryAddressKeyAsync,
} from './driveCrypto';

function useDriveCrypto() {
    const { createNotification } = useNotifications();
    const getAddressKeys = useGetAddressKeys();
    const getAddresses = useGetAddresses();
    const { UID } = useAuthentication();
    const getUser = useGetUser();
    const api = useApi();

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

            // We first try to fetch logged-in user keys and fallback to external publicKeys if case we found none
            // This behavior is intended for sharing as we try to get verification key from other users
            const result = await getOwnAddressKeysAsync(email, getAddresses, getAddressKeys);
            if (result?.publicKeys) {
                return result.publicKeys;
            }
            return getPublicKeysForEmail(api, email).then((publicKeys) => {
                if (!publicKeys) {
                    return [];
                }
                return Promise.all(
                    publicKeys.map((publicKey) => CryptoProxy.importPublicKey({ armoredKey: publicKey }))
                );
            });
        },
        [UID, getAddresses, getAddressKeys]
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
            // If logged-in we need to fetch AddressKeys (publicKeys + privateKeys) of the user,
            // otherwise we take the creator of the share
            const userEmail = !!UID ? await getUser().then((user) => user.Email) : undefined;
            let keys = await getOwnAddressKeys(userEmail || meta.creator);

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
