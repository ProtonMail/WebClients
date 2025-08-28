import { CryptoProxy } from '@proton/crypto';

/* Load Crypto API outside of web workers, for testing purposes.
 * Dynamic import to avoid loading the library unless required */
export async function setupCryptoProxyForTesting() {
    const { Api: CryptoApi } = await import('@proton/crypto/lib/worker/api');
    CryptoApi.init({});
    CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());
}

export function releaseCryptoProxy() {
    return CryptoProxy.releaseEndpoint();
}
