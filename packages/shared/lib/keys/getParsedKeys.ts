import { getKeys } from 'pmcrypto';
import { CachedKey } from '../interfaces';

export default async (keys: CachedKey[] = []): Promise<CachedKey[]> => {
    return Promise.all(
        keys.map(async (keyObject) => {
            const {
                Key: { PrivateKey },
                privateKey
            } = keyObject;
            if (privateKey) {
                return keyObject;
            }
            // If there is no private key, that means it's either: broken, encrypted, or invalid.
            const [key] = await getKeys(PrivateKey).catch(() => []);
            const publicKey = key?.toPublic();
            return {
                ...keyObject,
                privateKey: key,
                publicKey
            };
        })
    );
};
