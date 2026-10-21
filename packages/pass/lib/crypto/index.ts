import type { PassCryptoWorker } from '../../types/crypto/pass-crypto';

export let PassCrypto: PassCryptoWorker;
export const exposePassCrypto = (value: PassCryptoWorker) => (PassCrypto = value);
