import type { State } from '../../store';
import type { PassCryptoSnapshot, SerializedCryptoContext } from '../crypto';

export type ExtensionCache = { state: State; snapshot: SerializedCryptoContext<PassCryptoSnapshot> };
export type EncryptedExtensionCache = { state: string; snapshot: string; salt: string };
