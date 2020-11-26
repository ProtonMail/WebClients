import { useGetAddresses, useGetAddressKeys, useNotifications } from 'react-components';
import { sign as signMessage } from 'proton-shared/lib/keys/driveKeys';
import { Address } from 'proton-shared/lib/interfaces/Address';
import { OpenPGPKey } from 'pmcrypto';
import { useCallback } from 'react';
import { ADDRESS_STATUS } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { ShareMeta } from '../../interfaces/share';
import {
    decryptSharePassphraseAsync,
    getPrimaryAddressAsync,
    getPrimaryAddressKeyAsync,
    getOwnAddressKeysAsync,
} from '../../utils/drive/driveCrypto';

// Special case for drive to allow users with just an external address
export const getActiveAddresses = (addresses: Address[]): Address[] => {
    return addresses.filter(({ Status }) => Status === ADDRESS_STATUS.STATUS_ENABLED);
};

function useDriveCrypto() {
    const { createNotification } = useNotifications();
    const getAddressKeys = useGetAddressKeys();
    const getAddresses = useGetAddresses();

    const getPrimaryAddress = useCallback(async () => {
        return getPrimaryAddressAsync(getAddresses).catch((error) => {
            createNotification({ text: c('Error').t`No valid address found`, type: 'error' });
            throw error;
        });
    }, [getAddresses]);

    const getPrimaryAddressKey = useCallback(async () => {
        return getPrimaryAddressKeyAsync(getPrimaryAddress, getAddressKeys);
    }, [getPrimaryAddress, getAddressKeys]);

    const getOwnAddressKeys = useCallback(
        async (email: string) => getOwnAddressKeysAsync(email, getAddresses, getAddressKeys),
        [getAddresses, getAddressKeys]
    );

    const getVerificationKey = useCallback(
        async (email: string) => {
            const { publicKeys } = await getOwnAddressKeysAsync(email, getAddresses, getAddressKeys);
            return publicKeys;
        },
        [getAddresses, getAddressKeys]
    );

    const sign = useCallback(
        async (payload: string | Uint8Array, keys?: { privateKey: OpenPGPKey; address: Address }) => {
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
    const decryptSharePassphrase = async (meta: ShareMeta, privateKeys?: OpenPGPKey[]) => {
        return decryptSharePassphraseAsync(
            meta,
            privateKeys || (await getOwnAddressKeys(meta.Creator)).privateKeys,
            getVerificationKey
        );
    };

    return { getPrimaryAddressKey, getVerificationKey, getPrimaryAddress, sign, decryptSharePassphrase };
}

export default useDriveCrypto;
