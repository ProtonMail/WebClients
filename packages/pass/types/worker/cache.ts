import type { State } from '@proton/pass/store/types';

import type { PassCryptoSnapshot, SerializedCryptoContext } from '../crypto';

export type ExtensionCache = { state: State; snapshot: SerializedCryptoContext<PassCryptoSnapshot> };
export type EncryptedExtensionCache = { state: string; snapshot: string; salt: string; version?: string };
