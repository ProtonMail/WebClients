import { useGetAddresses, useGetAddressKeys, useNotifications } from 'react-components';
import { c } from 'ttag';
import getPrimaryKey from 'proton-shared/lib/keys/getPrimaryKey';
import { getActiveAddresses } from 'proton-shared/lib/helpers/address';
import { sign as signMessage } from 'proton-shared/lib/keys/driveKeys';
import { Address } from 'proton-shared/lib/interfaces/Address';
import { splitKeys } from 'proton-shared/lib/keys/keys';
import { OpenPGPKey } from 'pmcrypto';
import { useCallback } from 'react';

function useDriveCrypto() {
    const { createNotification } = useNotifications();
    const getAddressKeys = useGetAddressKeys();
    const getAddresses = useGetAddresses();

    const getPrimaryAddressKey = useCallback(async () => {
        const addresses = await getAddresses();
        const [activeAddress] = getActiveAddresses(addresses);

        if (!activeAddress) {
            createNotification({ text: c('Error').t`No valid address found`, type: 'error' });
            throw new Error('User has no active address');
        }

        const { privateKey, publicKey } = getPrimaryKey(await getAddressKeys(activeAddress.ID)) || {};

        if (!privateKey || !privateKey.isDecrypted()) {
            // Should never happen
            throw new Error('Primary private key is not decrypted');
        }

        return { privateKey, publicKey, address: activeAddress };
    }, [getAddresses]);

    const getVerificationKeys = useCallback(
        async (email: string) => {
            const addresses = await getAddresses();
            const ownAddress = addresses.find(({ Email }) => Email === email);
            if (!ownAddress) {
                // Should never happen
                throw new Error('Adress was not found.');
            }
            return splitKeys(await getAddressKeys(ownAddress.ID));
        },
        [getAddressKeys]
    );

    const sign = useCallback(
        async (payload: string, keys?: { privateKey: OpenPGPKey; address: Address }) => {
            const { privateKey, address } = keys || (await getPrimaryAddressKey());
            const signature = await signMessage(payload, [privateKey]);
            return { signature, address };
        },
        [getPrimaryAddressKey]
    );

    return { getPrimaryAddressKey, getVerificationKeys, sign };
}

export default useDriveCrypto;
