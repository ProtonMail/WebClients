import { OpenPGPKey } from 'pmcrypto';
import { CachedKey, ActionableKey } from '../interfaces';

export default async (keys: CachedKey[] = []): Promise<ActionableKey[]> => {
    return keys
        .filter((k): k is CachedKey & { privateKey: OpenPGPKey } => !!k.privateKey)
        .map(({ privateKey, Key: { ID, Primary, Flags } }) => {
            return {
                primary: Primary,
                // Flags is undefined for user keys, so dummy set those flags to 0
                flags: Flags || 0,
                privateKey,
                ID,
            };
        });
};
