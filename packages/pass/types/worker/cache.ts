import type { State } from '@proton/pass/store/types';

import type { PassCryptoSnapshot, SerializedCryptoContext } from '../crypto';

export type PassCache = { state: State; snapshot: SerializedCryptoContext<PassCryptoSnapshot> };

export type EncryptedPassCache = {
    state: string;
    snapshot: string;
    salt: string;
    version?: string;
};
