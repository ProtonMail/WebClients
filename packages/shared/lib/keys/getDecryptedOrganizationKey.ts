import { CryptoProxy } from '@proton/crypto';
import { CachedOrganizationKey, OrganizationKey } from '../interfaces';

export const getDecryptedOrganizationKey = async (OrganizationPrivateKey: string, keyPassword: string) => {
    const privateKey = await CryptoProxy.importPrivateKey({
        armoredKey: OrganizationPrivateKey,
        passphrase: keyPassword,
    });
    const publicKey = await CryptoProxy.importPublicKey({
        binaryKey: await CryptoProxy.exportPublicKey({ key: privateKey, format: 'binary' }),
    });
    return {
        privateKey,
        publicKey,
    };
};

export const getCachedOrganizationKey = async ({
    keyPassword,
    Key,
}: {
    keyPassword: string;
    Key: OrganizationKey;
}): Promise<CachedOrganizationKey> => {
    if (!Key.PrivateKey) {
        return {
            Key,
        };
    }
    try {
        const { privateKey, publicKey } = await getDecryptedOrganizationKey(Key.PrivateKey, keyPassword);
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
