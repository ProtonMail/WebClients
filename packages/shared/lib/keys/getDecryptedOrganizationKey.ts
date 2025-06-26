import { CryptoProxy } from '@proton/crypto';
import { decryptAddressKeyToken } from '@proton/shared/lib/keys/addressKeys';
import { splitKeys } from '@proton/shared/lib/keys/keys';
import { ORGANIZATION_SIGNATURE_CONTEXT, getIsPasswordless } from '@proton/shared/lib/keys/organizationKeys';

import type { CachedOrganizationKey, DecryptedKey, KeyPair, OrganizationKey } from '../interfaces';

export const getDecryptedOrganizationKey = async (armoredKey: string, passphrase: string) => {
    const privateKey = await CryptoProxy.importPrivateKey({
        armoredKey,
        passphrase,
    });
    // since we already have the armored private key, we avoid calling the
    // `toPublicKeyReference` helper which internally re-exports the key
    const publicKey = await CryptoProxy.importPublicKey({ armoredKey });
    return {
        privateKey,
        publicKey,
    };
};

export const getOrganizationKeyToken = async ({
    userKeys,
    Key,
    keyPassword,
}: {
    userKeys: KeyPair[];
    Key?: OrganizationKey;
    keyPassword: string;
}) => {
    if (getIsPasswordless(Key)) {
        const { privateKeys, publicKeys } = splitKeys(userKeys);
        return decryptAddressKeyToken({
            publicKeys,
            privateKeys,
            Token: Key.Token,
            Signature: Key.Signature,
            signatureContext: { value: ORGANIZATION_SIGNATURE_CONTEXT.SHARE_ORGANIZATION_KEY_TOKEN, required: true },
        });
    }
    return keyPassword;
};

export const getDecryptedOrganizationKeyHelper = async ({
    userKeys,
    Key,
    keyPassword,
}: {
    userKeys: KeyPair[];
    Key: OrganizationKey;
    keyPassword: string;
}) => {
    if (!Key.PrivateKey) {
        throw new Error('Missing key');
    }
    if (Key.LegacyPrivateKey) {
        return getDecryptedOrganizationKey(Key.LegacyPrivateKey, keyPassword);
    }
    return getDecryptedOrganizationKey(Key.PrivateKey, await getOrganizationKeyToken({ userKeys, Key, keyPassword }));
};

export const getCachedOrganizationKey = async ({
    userKeys,
    keyPassword,
    Key,
}: {
    userKeys: DecryptedKey[];
    keyPassword: string;
    Key: OrganizationKey;
}): Promise<CachedOrganizationKey> => {
    if (!Key.PrivateKey) {
        return {
            Key,
        };
    }
    try {
        const { privateKey, publicKey } = await getDecryptedOrganizationKeyHelper({
            Key,
            keyPassword,
            userKeys,
        });
        return {
            Key,
            privateKey,
            publicKey,
        };
    } catch (e: any) {
        return {
            Key,
            error: e,
        };
    }
};
