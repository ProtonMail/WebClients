import { CryptoProxy } from '@proton/crypto';

export const setupCryptoProxy = async () => {
    let module;
    try {
        module = await import(
            /* webpackChunkName: "es-migration-tools-crypto-worker" */
            '@proton/crypto/lib/worker/api'
        );
    } catch (e: any) {
        return;
    }

    const { Api: CryptoApi } = module;
    CryptoApi.init({});
    CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());
};
