import { CryptoProxy } from '@protontech/crypto';
import { OpenPGPCryptoWithCryptoProxy } from '@protontech/drive-sdk';

export function initOpenPGPCryptoModule() {
    const cryptoProxy = new OpenPGPCryptoWithCryptoProxy(CryptoProxy);

    return cryptoProxy;
}
