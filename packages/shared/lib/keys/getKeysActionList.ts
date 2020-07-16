import { CachedKey, KeyAction } from '../interfaces';

export default async (keys: CachedKey[] = []): Promise<KeyAction[]> => {
    return keys.map(({ privateKey, Key: { ID, Primary, Flags, Fingerprint } }) => {
        return {
            primary: Primary,
            // If there is no private key, it couldn't be decrypted. In that case we'll just use the fingerprint from the server.
            fingerprint: privateKey ? privateKey.getFingerprint() : Fingerprint,
            flags: Flags,
            ID,
        };
    });
};
