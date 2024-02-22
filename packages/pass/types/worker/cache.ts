import type { State } from '@proton/pass/store/types';

import type { PassCryptoSnapshot, SerializedCryptoContext } from '../crypto';

export type PassCache = { state: State; snapshot: SerializedCryptoContext<PassCryptoSnapshot> };

export type EncryptedPassCache = {
    encryptedCacheKey?: string;
    salt: string;
    snapshot: string;
    state: string;
    version?: string;
};
