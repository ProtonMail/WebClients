import { CryptoProxy } from '@protontech/crypto';

/**
 * Load Crypto API outside of web workers, for testing purposes.
 */
export async function setupCryptoProxyForTesting() {
    // dynamic import to avoid loading the library unless required
    const { Api: CryptoApi } = await import('@protontech/crypto/proxy/endpoint/api.ts');
    CryptoApi.init({});
    CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());
}

export function releaseCryptoProxy() {
    return CryptoProxy.releaseEndpoint();
}
