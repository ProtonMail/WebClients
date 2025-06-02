import { CryptoProxy } from '@proton/crypto';
import type { WorkerEncryptSessionKeyOptions } from '@proton/crypto/lib/worker/api.models';
import { OpenPGPCryptoWithCryptoProxy } from '@proton/drive-sdk';

type CryptoProxyCompatibility = typeof CryptoProxy & {
    // SDK enforces `binary` format for encrypting session keys, while
    // CryptoProxy has `armored` as default and only available via types.
    encryptSessionKey: (options: WorkerEncryptSessionKeyOptions & { format?: 'binary' }) => Promise<Uint8Array>;
};

export function initOpenPGPCryptoModule() {
    const cryptoProxy = new OpenPGPCryptoWithCryptoProxy(CryptoProxy as CryptoProxyCompatibility);

    return cryptoProxy;
}
