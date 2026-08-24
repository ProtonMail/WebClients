import type { PassCryptoWorker } from '../../types';

export let PassCrypto: PassCryptoWorker;
export const exposePassCrypto = (value: PassCryptoWorker) => (PassCrypto = value);
