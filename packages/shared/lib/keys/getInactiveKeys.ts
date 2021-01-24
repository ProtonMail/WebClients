import { getKeys } from 'pmcrypto';
import { DecryptedKey, Key } from '../interfaces';

export const getInactiveKeys = async (Keys: Key[], decryptedKeys: DecryptedKey[]) => {
    const decryptedKeysIDs = new Set<string>(decryptedKeys.map(({ ID }) => ID));
    const inactiveKeys = Keys.filter(({ ID }) => !decryptedKeysIDs.has(ID));
    return Promise.all(
        inactiveKeys.map(async (Key) => {
            const [privateKey] = await getKeys(Key.PrivateKey).catch(() => []);
            return {
                Key,
                privateKey,
                publicKey: privateKey?.toPublic(),
                fingerprint: privateKey?.getFingerprint(),
            };
        })
    );
};
