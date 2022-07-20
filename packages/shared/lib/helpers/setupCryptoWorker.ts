import { CryptoProxy } from '@proton/crypto';
import { CryptoWorkerPool } from '@proton/crypto/lib/worker/workerPool';
import { hasModulesSupport, getOS } from './browser';

let promise: undefined | Promise<void>;

/**
 * There is a bug in iOS that prevents the openpgp worker from functioning properly.
 * It's on all browsers there because they use the webkit engine.
 * See https://github.com/ProtonMail/Angular/issues/8444
 */
const isUnsupportedWorker = () => {
    const { name, version } = getOS();
    return name.toLowerCase() === 'ios' && parseInt(version, 10) === 11;
};

/**
 * Initialize worker pool and set it as CryptoProxy endpoint.
 * If workers are not supported by the current browser, the pmcrypto API is imported instead.
 */
const init = async () => {
    const isCompat = !hasModulesSupport();

    // Compat browsers do not support the worker.
    if (isCompat || isUnsupportedWorker()) {
        // dynamic import needed to avoid loading openpgp into the main thread, unless we get here
        const { Api: CryptoApi } = await import('@proton/crypto/lib/worker/api');
        CryptoApi.init();
        CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());
    } else {
        await CryptoWorkerPool.init();
        CryptoProxy.setEndpoint(CryptoWorkerPool, (endpoint) => endpoint.destroy());
    }
};

/**
 * Start crypto worker and set it as `CryptoProxy` endpoint.
 * If the crypto worker was already loaded, this function is a no-op.
 * If the browser does not support workers, the pmcrypto API (including OpenPGP.js) is loaded directly in the main thread.
 * @returns init promise singleton
 */
export const loadCryptoWorker = () => {
    if (!promise) {
        promise = init();
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
