import { decryptPrivateKey } from 'pmcrypto';
import { CachedOrganizationKey, OrganizationKey } from '../interfaces';

export const getDecryptedOrganizationKey = async ({
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
        const privateKey = await decryptPrivateKey(Key.PrivateKey, keyPassword);
        return {
            Key,
            privateKey,
        };
    } catch (e) {
        return {
            Key,
            error: e,
        };
    }
};
