import { OpenPGPCryptoWithCryptoProxy } from '@protontech/drive-sdk';
import { CryptoProxy } from '@protontech/crypto';

export function initOpenPGPCryptoModule() {
    // @ts-expect-error until sdk releases new version with crypto module integration
    const cryptoProxy = new OpenPGPCryptoWithCryptoProxy(CryptoProxy as CryptoProxyCompatibility);

    return cryptoProxy;
}
