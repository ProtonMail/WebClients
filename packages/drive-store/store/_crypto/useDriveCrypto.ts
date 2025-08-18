import { useCallback } from 'react';

import { c } from 'ttag';

import { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useAuthentication, useNotifications } from '@proton/components';
import type { PrivateKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { ADDRESS_STATUS } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import { sign as signMessage } from '@proton/shared/lib/keys/driveKeys';
import { type VerificationKeysCallback, decryptPassphrase } from '@proton/shared/lib/keys/drivePassphrase';

import type { ShareWithKey } from '../_shares';
import { useGetPublicKeysForEmail } from '../_user';
import {
    getOwnAddressAndPrimaryKeysAsync,
    getOwnAddressKeysAsync,
    getOwnAddressKeysWithEmailAsync,
    getPrimaryAddressAsync,
    getPrimaryAddressKeyAsync,
} from './driveCrypto';

function useDriveCrypto() {
    const { createNotification } = useNotifications();
    const getAddressKeys = useGetAddressKeys();
    const getAddresses = useGetAddresses();
    const { UID } = useAuthentication();
    const { getPublicKeysForEmail } = useGetPublicKeysForEmail();

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
        async (addressId: string) => getOwnAddressKeysAsync(addressId, getAddresses, getAddressKeys),
        [getAddresses, getAddressKeys]
    );

    // This should be used for encryption and signing of any content.
    const getOwnAddressAndPrimaryKeys = useCallback(
        async (addressId: string) => getOwnAddressAndPrimaryKeysAsync(addressId, getAddresses, getAddressKeys),
        [getAddresses, getAddressKeys]
    );

    const getPrivateAddressKeys = useCallback(
        async (addressId: string) => {
            const result = await getOwnAddressKeysAsync(addressId, getAddresses, getAddressKeys);
            return result?.privateKeys || [];
        },
        [getAddresses, getAddressKeys]
    );

    const getVerificationKeysCallbackList = useCallback(
        async (email?: string): Promise<VerificationKeysCallback[]> => {
            // If UID is empty, it means user is not logged in.
            // We don't support checking signatures for public session yet
            // so lets simply return no keys instead of firing exceptions.
            if (!email || !UID) {
                return [];
            }

            const addresses = await getAddresses();
            const enabledAddresses = addresses.filter(({ Status }) => Status === ADDRESS_STATUS.STATUS_ENABLED);
            const otherAddresses = addresses.filter(({ Status }) => Status !== ADDRESS_STATUS.STATUS_ENABLED);

            // This logic is based of /documentation/specifications/crypto/signatures-concepts/
            // These 3 cases are callbacks in purpose so we don't execute them for no reason and avoid the overhead

            // (1) Most of the cases the current user logged-in address keys would be the correct ones
            const getOwnEnabledKeys: VerificationKeysCallback = async () => {
                const result = await getOwnAddressKeysWithEmailAsync(
                    email,
                    async () => {
                        return enabledAddresses;
                    },
                    getAddressKeys
                );

                if (result?.publicKeys) {
                    return result.publicKeys;
                }
                return [];
            };

            // (2) In the case of sharing, we must fetch the creator address public keys
            const getPublicKeys: VerificationKeysCallback = async () => {
                const publicKeys = await getPublicKeysForEmail(email);
                if (!publicKeys) {
                    return [];
                }
                return Promise.all(
                    publicKeys.map((publicKey) => CryptoProxy.importPublicKey({ armoredKey: publicKey }))
                );
            };

            // (3) The last case and the least occuring one is, if none of the validation worked for the 2 previous case
            // We also attempt using the disabled address keys
            // This can be in the scenario someone disabled an address, we still want the validation to work
            const getOwnAllKeys: VerificationKeysCallback = async () => {
                const result = await getOwnAddressKeysWithEmailAsync(
                    email,
                    async () => {
                        return otherAddresses;
                    },
                    getAddressKeys
                );

                if (result?.publicKeys) {
                    return result.publicKeys;
                }
                return [];
            };

            const callbacks = [getOwnEnabledKeys, getPublicKeys];
            if (otherAddresses.length > 0) {
                callbacks.push(getOwnAllKeys);
            }
            return callbacks;
        },
        [UID, getAddresses, getAddressKeys, getPublicKeysForEmail]
    );

    const getVerificationKey = useCallback(
        async (email?: string) => {
            const publicKeysCallbackList = await getVerificationKeysCallbackList(email);
            for (const publicKeysCallback of publicKeysCallbackList) {
                const publicKeys = await publicKeysCallback();
                if (publicKeys && publicKeys.length) {
                    return publicKeys;
                }
            }
            return [];
        },
        [getVerificationKeysCallbackList]
    );

    const sign = useCallback(
        async (
            payload: string | Uint8Array<ArrayBuffer>,
            keys?: { privateKey: PrivateKeyReference; address: Address }
        ) => {
            const { privateKey, address } = keys || (await getPrimaryAddressKey());
            const signature = await signMessage(payload, [privateKey]);
            return { signature, address };
        },
        [getPrimaryAddressKey]
    );

    const decryptSharePassphraseAsync = async (meta: ShareWithKey, privateKeys: PrivateKeyReference[]) => {
        const publicKeysCallbackList = await getVerificationKeysCallbackList(meta.creator);
        const passphrase = await decryptPassphrase({
            armoredPassphrase: meta.passphrase,
            armoredSignature: meta.passphraseSignature,
            privateKeys,
            publicKeysCallbackList,
        });
        return passphrase;
    };

    /**
     * Decrypts share passphrase. By default decrypts with the same user's keys who encrypted.
     * Keys can be passed explicitly if user is different, i.e. in case of sharing between users.
     * @param meta share metadata
     * @param privateKeys keys to use, when the user is not the same who encrypted
     */
    const decryptSharePassphrase = async (meta: ShareWithKey, privateKeys?: PrivateKeyReference[]) => {
        if (!privateKeys) {
            // AddressId will always be for the logged-in user
            const keys = await getOwnAddressKeys(meta.addressId);

            if (!keys) {
                throw new Error('Address key was not found');
            }

            privateKeys = keys.privateKeys;
        }
        return decryptSharePassphraseAsync(meta, privateKeys);
    };

    return {
        getPrimaryAddressKey,
        getOwnAddressAndPrimaryKeys,
        getPrivateAddressKeys,
        getVerificationKey,
        getVerificationKeysCallbackList,
        getPrimaryAddress,
        sign,
        decryptSharePassphrase,
    };
}

export default useDriveCrypto;
