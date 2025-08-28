import { CryptoProxy } from '@proton/crypto';
import type { WorkerPoolInitOptions as CryptoWorkerOptions } from '@proton/crypto/lib/worker/workerPool';
import { CryptoWorkerPool } from '@proton/crypto/lib/worker/workerPool';

import { hasModulesSupport } from './browser';

let promise: undefined | Promise<void>;

/**
 * Initialize worker pool and set it as CryptoProxy endpoint.
 * If workers are not supported by the current browser, the pmcrypto API is imported instead.
 */
const init = async (options?: CryptoWorkerOptions) => {
    const isWorker = typeof window === 'undefined' || typeof document === 'undefined';
    const isCompat = isWorker || !hasModulesSupport();

    // Compat browsers do not support the worker.
    if (isCompat) {
        // dynamic import needed to avoid loading openpgp into the main thread, unless we get here
        const { Api: CryptoApi } = await import(
            /* webpackChunkName: "crypto-worker-api" */ '@proton/crypto/lib/worker/api'
        );
        CryptoApi.init(options?.openpgpConfigOptions || {});
        CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());
    } else {
        await CryptoWorkerPool.init(options);
        CryptoProxy.setEndpoint(CryptoWorkerPool, (endpoint) => endpoint.destroy());
    }
};

/**
 * Start crypto worker and set it as `CryptoProxy` endpoint.
 * If the crypto worker was already loaded, this function is a no-op.
 * If the browser does not support workers, the pmcrypto API (including OpenPGP.js) is loaded directly in the main thread.
 * @returns init promise singleton
 */
export const loadCryptoWorker = (options?: CryptoWorkerOptions) => {
    if (!promise) {
        promise = init(options);
    }
    return promise;
};

/**
 * Release crypto worker as `CryptoProxy` endpoint, then clear the key store and terminate the worker.
 */
export const destroyCryptoWorker = () => {
    promise = undefined;

    return CryptoProxy.releaseEndpoint();
};

export type { CryptoWorkerOptions };
