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
    getVerificationKeysAsync,
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

    const getVerificationKeys = useCallback(
        async (email: string) => getVerificationKeysAsync(getAddresses, getAddressKeys, email),
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

    const decryptSharePassphrase = (meta: ShareMeta) => {
        return decryptSharePassphraseAsync(meta, getVerificationKeys);
    };

    return { getPrimaryAddressKey, getVerificationKeys, getPrimaryAddress, sign, decryptSharePassphrase };
}

export default useDriveCrypto;
