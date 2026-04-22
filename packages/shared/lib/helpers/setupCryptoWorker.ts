import { CryptoProxy } from '@protontech/crypto';
import type { WorkerPoolInitOptions } from '@protontech/crypto/proxy/endpoint/workerPool/interface.ts';
import { CryptoWorkerPool } from '@protontech/crypto/proxy/endpoint/workerPool/webpackProvider.ts';

import { hasModulesSupport } from './browser';
import { captureMessage } from './sentry';

let promise: undefined | Promise<void>;

export type CryptoWorkerOptions = Omit<WorkerPoolInitOptions, 'sentryLogger'>;

/**
 * Initialize worker pool and set it as CryptoProxy endpoint.
 * If workers are not supported by the current browser, the crypto API is used directly instead.
 */
const init = async (options: CryptoWorkerOptions = {}) => {
    const isWorker = typeof window === 'undefined' || typeof document === 'undefined';
    const isCompat = isWorker || !hasModulesSupport();

    // Compat browsers do not support the worker.
    if (isCompat) {
        // dynamic import needed to avoid loading openpgp into the main thread, unless we get here
        const { Api: CryptoApi } = await import(
            /* webpackChunkName: "crypto-worker-api" */ '@protontech/crypto/proxy/endpoint/api.ts'
        );
        CryptoApi.init(options?.openpgpConfigOptions || {});
        CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());
        CryptoProxy.setSentryLogger(captureMessage);
    } else {
        await CryptoWorkerPool.init({
            awaitOnFirstUseErrorCallback: options?.awaitOnFirstUse
                ? (err: unknown) =>
                      captureMessage('CryptoWorkerPool init error', {
                          level: 'error',
                          extra: { message: err instanceof Error ? err.message : 'Unknown error' },
                      })
                : undefined,
            ...options,
            sentryLogger: captureMessage,
        });
        CryptoProxy.setEndpoint(CryptoWorkerPool, (endpoint) => endpoint.destroy());
        CryptoProxy.setSentryLogger(captureMessage);
    }
};

/**
 * Start crypto worker and set it as `CryptoProxy` endpoint.
 * If the crypto worker was already loaded, this function is a no-op.
 * If the browser does not support workers, the crypto API (including OpenPGP.js) is loaded directly in the main thread.
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
