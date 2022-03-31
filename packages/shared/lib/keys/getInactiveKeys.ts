import { CryptoProxy } from '@proton/crypto';
import { DecryptedKey, InactiveKey, Key } from '../interfaces';

export const getInactiveKeys = async (Keys: Key[], decryptedKeys: DecryptedKey[]): Promise<InactiveKey[]> => {
    const decryptedKeysIDs = new Set<string>(decryptedKeys.map(({ ID }) => ID));
    const inactiveKeys = Keys.filter(({ ID }) => !decryptedKeysIDs.has(ID));
    return Promise.all(
        inactiveKeys.map(async (Key) => {
            const publicKey = await CryptoProxy.importPublicKey({ armoredKey: Key.PublicKey }).catch(() => undefined);
            return {
                Key,
                publicKey,
                fingerprint: publicKey?.getFingerprint(),
            };
        })
    );
};
