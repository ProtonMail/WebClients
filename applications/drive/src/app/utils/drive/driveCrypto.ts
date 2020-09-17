import { c } from 'ttag';
import { OpenPGPKey } from 'pmcrypto';
import { splitKeys } from 'proton-shared/lib/keys/keys';
import { Address } from 'proton-shared/lib/interfaces/Address';
import { CachedKey } from 'proton-shared/lib/interfaces';
import { ADDRESS_STATUS } from 'proton-shared/lib/constants';
import getPrimaryKey from 'proton-shared/lib/keys/getPrimaryKey';

export interface PrimaryAddressKey {
    privateKey: OpenPGPKey;
    publicKey: OpenPGPKey | undefined;
    address: Address;
}

export interface VerificationKeys {
    privateKeys: OpenPGPKey[];
    publicKeys: OpenPGPKey[];
}

// Special case for drive to allow users with just an external address
export const getActiveAddresses = (addresses: Address[]): Address[] => {
    return addresses.filter(({ Status }) => Status === ADDRESS_STATUS.STATUS_ENABLED);
};

export const getPrimaryAddressKey = async (
    getAddresses: () => Promise<Address[]>,
    getAddressKeys: (id: string) => Promise<CachedKey[]>,
    createNotification: any
) => {
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
};

export const getVerificationKeys = async (
    getAddresses: () => Promise<Address[]>,
    getAddressKeys: (id: string) => Promise<CachedKey[]>,
    email: string
) => {
    const addresses = await getAddresses();
    const ownAddress = addresses.find(({ Email }) => Email === email);
    if (!ownAddress) {
        // Should never happen
        throw new Error('Adress was not found.');
    }
    return splitKeys(await getAddressKeys(ownAddress.ID));
};
