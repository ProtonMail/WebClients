import { decryptPrivateKey } from 'pmcrypto';
import { CachedOrganizationKey, OrganizationKey } from '../interfaces';

export const getDecryptedOrganizationKey = async (OrganizationPrivateKey: string, keyPassword: string) => {
    const privateKey = await decryptPrivateKey(OrganizationPrivateKey, keyPassword);
    return {
        privateKey,
        publicKey: privateKey.toPublic(),
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
    } catch (e) {
        return {
            Key,
            error: e,
        };
    }
};
