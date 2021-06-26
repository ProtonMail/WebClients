import { c } from 'ttag';
import {
    OpenPGPKey,
    VERIFICATION_STATUS,
    decryptMessage,
    getMessage,
    decryptSessionKey,
    getSignature,
    OpenPGPMessage,
} from 'pmcrypto';
import { splitKeys } from '@proton/shared/lib/keys/keys';
import { Address } from '@proton/shared/lib/interfaces/Address';
import { DecryptedKey } from '@proton/shared/lib/interfaces';
import { ADDRESS_STATUS } from '@proton/shared/lib/constants';
import { getPrimaryKey } from '@proton/shared/lib/keys';
import { ShareMeta } from '../../interfaces/share';

export interface PrimaryAddressKey {
    privateKey: OpenPGPKey;
    publicKey: OpenPGPKey | undefined;
    address: Address;
}

export const getDecryptedSessionKey = async ({
    data,
    privateKeys,
}: {
    data: string | OpenPGPMessage | Uint8Array;
    privateKeys: OpenPGPKey | OpenPGPKey[];
}) => {
    const message = await getMessage(data);
    const sessionKey = await decryptSessionKey({ message, privateKeys });

    if (!sessionKey) {
        throw new Error('Could not decrypt session key');
    }

    return sessionKey;
};

export const decryptPassphrase = async ({
    armoredPassphrase,
    armoredSignature,
    privateKeys,
    publicKeys,
}: {
    armoredPassphrase: string;
    armoredSignature: string;
    privateKeys: OpenPGPKey[];
    publicKeys: OpenPGPKey[];
}) => {
    const [message, sessionKey] = await Promise.all([
        getMessage(armoredPassphrase),
        getDecryptedSessionKey({ data: armoredPassphrase, privateKeys }),
    ]);

    const { data: decryptedPassphrase, verified } = await decryptMessage({
        message,
        signature: await getSignature(armoredSignature),
        sessionKeys: sessionKey,
        publicKeys,
    });

    if (verified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
        const error = new Error(c('Error').t`Signature verification failed`);
        error.name = 'SignatureError';
        throw error;
    }

    return { decryptedPassphrase: decryptedPassphrase as string, sessionKey };
};

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
    const { privateKey, publicKey } = getPrimaryKey(addressKeys) || {};

    if (!privateKey || !privateKey.isDecrypted()) {
        // Should never happen
        throw new Error('Primary private key is not decrypted');
    }

    return { privateKey, publicKey: publicKey || privateKey.toPublic(), address: activeAddress };
};

export const getOwnAddressKeysAsync = async (
    email: string,
    getAddresses: () => Promise<Address[]>,
    getAddressKeys: (id: string) => Promise<DecryptedKey[]>
) => {
    const addresses = await getAddresses();
    const ownAddress = addresses.find(({ Email }) => Email === email);
    if (!ownAddress) {
        // Should never happen
        throw new Error('Address was not found.');
    }
    return splitKeys(await getAddressKeys(ownAddress.ID));
};

export const decryptSharePassphraseAsync = async (
    meta: ShareMeta,
    privateKeys: OpenPGPKey[],
    getVerificationKey: (email: string) => Promise<OpenPGPKey[]>
) => {
    const publicKeys = await getVerificationKey(meta.Creator);
    return decryptPassphrase({
        armoredPassphrase: meta.Passphrase,
        armoredSignature: meta.PassphraseSignature,
        privateKeys,
        publicKeys,
    });
};
