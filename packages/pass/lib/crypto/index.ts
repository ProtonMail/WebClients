import type { PassCryptoWorker } from '@proton/pass/types';

export let PassCrypto: PassCryptoWorker;
export const exposePassCrypto = (value: PassCryptoWorker) => (PassCrypto = value);
