import { OpenPGPCryptoWithCryptoProxy } from '@protontech/drive-sdk';

import { CryptoProxy } from '@proton/crypto';
import type { WorkerEncryptSessionKeyOptions } from '@proton/crypto/lib/worker/api.models';

type CryptoProxyCompatibility = typeof CryptoProxy & {
    // SDK enforces `binary` format for encrypting session keys, while
    // CryptoProxy has `armored` as default and only available via types.
    encryptSessionKey: (options: WorkerEncryptSessionKeyOptions & { format?: 'binary' }) => Promise<Uint8Array<ArrayBuffer>>;
};

// TODO: remove `as any` when the type is fixed in the sdk
export function initOpenPGPCryptoModule() {
    const cryptoProxy = new OpenPGPCryptoWithCryptoProxy(CryptoProxy as CryptoProxyCompatibility as any);

    return cryptoProxy;
}
