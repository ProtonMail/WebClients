import { PrivateKeyReference, PublicKeyReference, toPublicKeyReference } from '@proton/crypto';
import { ADDRESS_STATUS } from '@proton/shared/lib/constants';
import { canonicalizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { DecryptedKey } from '@proton/shared/lib/interfaces';
import { Address } from '@proton/shared/lib/interfaces/Address';
import { getPrimaryKey } from '@proton/shared/lib/keys';
import { decryptPassphrase } from '@proton/shared/lib/keys/drivePassphrase';
import { splitKeys } from '@proton/shared/lib/keys/keys';

import { ShareWithKey } from '../_shares';

export interface PrimaryAddressKey {
    privateKey: PrivateKeyReference;
    publicKey: PublicKeyReference | undefined;
    address: Address;
}

// Special case for drive to allow users with just an external address
export const getActiveAddresses = (addresses: Address[]): Address[] => {
    return addresses.filter(({ Status }) => Status === ADDRESS_STATUS.STATUS_ENABLED);
};

export const getPrimaryAddressAsync = async (getAddresses: () => Promise<Address[]>) => {
    const addresses = await getAddresses();
    const [activeAddress] = getActiveAddresses(addresses);

    if (!activeAddress) {
        throw new Error('User has no active address');
    }

    return activeAddress;
};

export const getPrimaryAddressKeyAsync = async (
    getPrimaryAddress: () => Promise<Address>,
    getAddressKeys: (id: string) => Promise<DecryptedKey[]>
) => {
    const activeAddress = await getPrimaryAddress();
    const addressKeys = await getAddressKeys(activeAddress.ID);
    const { privateKey, publicKey: maybePublicKey } = getPrimaryKey(addressKeys) || {};

    if (!privateKey) {
        // Should never happen
        throw new Error('Primary private key is not available');
    }

    const publicKey = maybePublicKey || (await toPublicKeyReference(privateKey));

    return { privateKey, publicKey, address: activeAddress };
};

const getOwnAddress = async (email: string, getAddresses: () => Promise<Address[]>) => {
    // Some characters can be changed but still be the same email.
    return (await getAddresses()).find(
        ({ Email }) => canonicalizeInternalEmail(Email) === canonicalizeInternalEmail(email)
    );
};

const getOwnAddressAndKeys = async (
    email: string,
    getAddresses: () => Promise<Address[]>,
    getAddressKeys: (id: string) => Promise<DecryptedKey[]>
) => {
    const address = await getOwnAddress(email, getAddresses);
    if (!address) {
        return {};
    }
    const addressKeys = await getAddressKeys(address.ID);

    return { address, addressKeys };
};

export const getOwnAddressAndPrimaryKeysAsync = async (
    email: string,
    getAddresses: () => Promise<Address[]>,
    getAddressKeys: (id: string) => Promise<DecryptedKey[]>
) => {
    const { address, addressKeys } = await getOwnAddressAndKeys(email, getAddresses, getAddressKeys);
    const { privateKey, publicKey } = getPrimaryKey(addressKeys) || {};

    if (!privateKey) {
        // Should never happen
        throw new Error('Primary private key is not available');
    }
    if (!address) {
        // Should never happen
        throw new Error('Address is not available');
    }

    return { address, privateKey, publicKey: publicKey || (await toPublicKeyReference(privateKey)) };
};

export const getOwnAddressKeysAsync = async (
    email: string,
    getAddresses: () => Promise<Address[]>,
    getAddressKeys: (id: string) => Promise<DecryptedKey[]>
) => {
    const { addressKeys } = await getOwnAddressAndKeys(email, getAddresses, getAddressKeys);
    return addressKeys ? splitKeys(addressKeys) : undefined;
};

export const decryptSharePassphraseAsync = async (
    meta: ShareWithKey,
    privateKeys: PrivateKeyReference[],
    getVerificationKey: (email: string) => Promise<PublicKeyReference[]>
) => {
    const publicKeys = await getVerificationKey(meta.creator);
    return decryptPassphrase({
        armoredPassphrase: meta.passphrase,
        armoredSignature: meta.passphraseSignature,
        privateKeys,
        publicKeys,
    });
};
