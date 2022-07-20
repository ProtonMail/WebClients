// NB: it is important to only import this as a type
import { serverTime } from '../serverTime';
import type { ApiInterface as CryptoApiInterface } from '../worker/api';

export { CryptoApiInterface };
export { VERIFICATION_STATUS } from 'pmcrypto-v7/lib/constants';
export type { enums } from 'pmcrypto-v7/lib/openpgp'; // NB: it is important to only import this as a type

const assertNotNull = (value: CryptoApiInterface | null): CryptoApiInterface => {
    if (value === null) {
        throw new Error('CryptoProxy: endpoint not initialized');
    }
    return value;
};

let endpoint: CryptoApiInterface | null = null;
let onEndpointRelease: (endpoint?: any) => Promise<void> = async () => {};

interface CryptoProxyInterface extends CryptoApiInterface {
    /**
     * Set proxy endpoint.
     * The provided instance must be already initialised and ready to resolve requests.
     * @param endpoint
     * @param onRelease - callback called after `this.releaseEndpoint()` is invoked and endpoint is released
     */
    setEndpoint<T extends CryptoApiInterface>(endpoint: T, onRelease?: (endpoint: T) => Promise<void>): void;
    /**
     * Release endpoint. Afterwards, a different one may be set via `setEndpoint()`.
     * If a `onRelease` callback was passed to `setEndpoint()`, the callback is called before returning.
     * Note that this function does not have any other side effects, e.g. it does not clear the key store automatically.
     * Any endpoint-specific clean up logic should be done inside the `onRelease` callback.
     */
    releaseEndpoint(): Promise<void>;
}

/**
 * CryptoProxy relays crypto requests to the specified endpoint, which is typically a worker(s), except if
 * CryptoProxy is already called (also indirectly) from inside a worker.
 * In such a case, the endpoint can be set to a `new WorkerApi()` instance, or to tbe worker instance itself,
 * provided it implements/extends WorkerApi.
 */
export const CryptoProxy: CryptoProxyInterface = {
    setEndpoint(endpointInstance, onRelease = onEndpointRelease) {
        if (endpoint) {
            throw new Error('already initialised');
        }
        endpoint = endpointInstance;
        onEndpointRelease = onRelease;
    },

    releaseEndpoint() {
        const tmp = endpoint;
        endpoint = null;
        return onEndpointRelease(assertNotNull(tmp));
    },

    encryptMessage: async (opts) => assertNotNull(endpoint).encryptMessage({ date: serverTime(), ...opts }),
    decryptMessage: async (opts) => assertNotNull(endpoint).decryptMessage({ date: serverTime(), ...opts }),
    decryptMessageLegacy: async (opts) => assertNotNull(endpoint).decryptMessageLegacy({ date: serverTime(), ...opts }),
    signMessage: async (opts) => assertNotNull(endpoint).signMessage({ date: serverTime(), ...opts }),
    verifyMessage: async (opts) => assertNotNull(endpoint).verifyMessage({ date: serverTime(), ...opts }),
    verifyCleartextMessage: async (opts) =>
        assertNotNull(endpoint).verifyCleartextMessage({ date: serverTime(), ...opts }),
    processMIME: async (opts) => assertNotNull(endpoint).processMIME({ date: serverTime(), ...opts }),

    generateSessionKey: async (opts) => assertNotNull(endpoint).generateSessionKey({ date: serverTime(), ...opts }),
    generateSessionKeyForAlgorithm: async (opts) => assertNotNull(endpoint).generateSessionKeyForAlgorithm(opts),
    encryptSessionKey: async (opts) => assertNotNull(endpoint).encryptSessionKey({ date: serverTime(), ...opts }),
    decryptSessionKey: async (opts) => assertNotNull(endpoint).decryptSessionKey({ date: serverTime(), ...opts }),

    importPrivateKey: async (opts) => assertNotNull(endpoint).importPrivateKey(opts),
    importPublicKey: async (opts) => assertNotNull(endpoint).importPublicKey(opts),
    generateKey: async (opts) => assertNotNull(endpoint).generateKey({ date: serverTime(), ...opts }),
    reformatKey: async (opts) => assertNotNull(endpoint).reformatKey({ date: serverTime(), ...opts }),
    exportPublicKey: async (opts) => assertNotNull(endpoint).exportPublicKey(opts),
    exportPrivateKey: async (opts) => assertNotNull(endpoint).exportPrivateKey(opts),
    clearKeyStore: () => assertNotNull(endpoint).clearKeyStore(),
    clearKey: async (opts) => assertNotNull(endpoint).clearKey(opts),
    replaceUserIDs: async (opts) => assertNotNull(endpoint).replaceUserIDs(opts),

    isRevokedKey: async (opts) => assertNotNull(endpoint).isRevokedKey({ date: serverTime(), ...opts }),
    isExpiredKey: async (opts) => assertNotNull(endpoint).isExpiredKey({ date: serverTime(), ...opts }),
    canKeyEncrypt: async (opts) => assertNotNull(endpoint).canKeyEncrypt({ date: serverTime(), ...opts }),
    getSHA256Fingerprints: async (opts) => assertNotNull(endpoint).getSHA256Fingerprints(opts),
    computeHash: async (opts) => assertNotNull(endpoint).computeHash(opts),

    getArmoredMessage: async (opts) => assertNotNull(endpoint).getArmoredMessage(opts),
    getArmoredKeys: async (opts) => assertNotNull(endpoint).getArmoredKeys(opts),
    getArmoredSignature: async (opts) => assertNotNull(endpoint).getArmoredSignature(opts),
    getSignatureInfo: async (opts) => assertNotNull(endpoint).getSignatureInfo(opts),
    getMessageInfo: async (opts) => assertNotNull(endpoint).getMessageInfo(opts),
    getKeyInfo: async (opts) => assertNotNull(endpoint).getKeyInfo(opts),
};
