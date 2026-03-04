import { CryptoProxy } from '@proton/crypto';

export const setupCryptoProxy = async () => {
    try {
        const { Api: CryptoApi } = await import(
            /* webpackChunkName: "es-migration-tools-crypto-worker" */
            '@proton/crypto/lib/worker/api'
        );

        CryptoApi.init({});
        CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());
    } catch (e: any) {
        return;
    }
};
