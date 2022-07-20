import { ADDRESS_STATUS } from '@proton/shared/lib/constants';
import { DecryptedKey } from '@proton/shared/lib/interfaces';
import { Address } from '@proton/shared/lib/interfaces/Address';
import { getPrimaryKey } from '@proton/shared/lib/keys';
import { canonizeInternalEmail } from '@proton/shared/lib/helpers/email';
import { splitKeys } from '@proton/shared/lib/keys/keys';
import { decryptPassphrase } from '@proton/shared/lib/keys/drivePassphrase';
import { PrivateKeyReference, PublicKeyReference, toPublicKeyReference } from '@proton/crypto';

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

export const getPrimaryAddressKeysAsync = async (
    getPrimaryAddress: () => Promise<Address>,
    getAddressKeys: (id: string) => Promise<DecryptedKey[]>
) => {
    const activeAddress = await getPrimaryAddress();
    const addressKeys = await getAddressKeys(activeAddress.ID);
    return Promise.all(
        addressKeys.map(async ({ privateKey, publicKey }) => ({
            privateKey,
            publicKey: publicKey || (await toPublicKeyReference(privateKey)),
        }))
    );
};

const getOwnAddressKeys = async (
    email: string,
    getAddresses: () => Promise<Address[]>,
    getAddressKeys: (id: string) => Promise<DecryptedKey[]>
) => {
    const addresses = await getAddresses();
    // Some characters can be changed but still be the same email.
    const ownAddress = addresses.find(({ Email }) => canonizeInternalEmail(Email) === canonizeInternalEmail(email));
    if (!ownAddress) {
        return;
    }
    return getAddressKeys(ownAddress.ID);
};

export const getOwnAddressPrimaryKeyAsync = async (
    email: string,
    getAddresses: () => Promise<Address[]>,
    getAddressKeys: (id: string) => Promise<DecryptedKey[]>
) => {
    const addressKeys = await getOwnAddressKeys(email, getAddresses, getAddressKeys);
    const { privateKey, publicKey } = getPrimaryKey(addressKeys) || {};

    if (!privateKey) {
        // Should never happen
        throw new Error('Primary private key is not available');
    }

    return { privateKey, publicKey: publicKey || (await toPublicKeyReference(privateKey)) };
};

export const getOwnAddressKeysAsync = async (
    email: string,
    getAddresses: () => Promise<Address[]>,
    getAddressKeys: (id: string) => Promise<DecryptedKey[]>
) => {
    const addressKeys = await getOwnAddressKeys(email, getAddresses, getAddressKeys);
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
