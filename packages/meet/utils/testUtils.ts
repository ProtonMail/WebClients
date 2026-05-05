import { CryptoProxy } from '@protontech/crypto';

/* Load Crypto API outside of web workers, for testing purposes.
 * Dynamic import to avoid loading the library unless required */
export async function setupCryptoProxyForTesting() {
    const { Api: CryptoApi } = await import(
        /* webpackChunkName: "crypto-worker-api" */ '@protontech/crypto/proxy/endpoint/api.ts'
    );
    CryptoApi.init({});
    CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());
}

export function releaseCryptoProxy() {
    return CryptoProxy.releaseEndpoint();
}
