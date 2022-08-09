import { VERIFICATION_STATUS } from 'pmcrypto-v7/lib/constants';

import { captureMessage } from '@proton/shared/lib/helpers/sentry';

import { serverTime } from '../serverTime';
import type { ApiInterface as CryptoApiInterface } from '../worker/api';
import { WorkerVerifyOptions } from '../worker/api.models';

export { CryptoApiInterface, VERIFICATION_STATUS };

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
 * Prior to OpenPGP.js v5.4.0, trailing spaces were not properly stripped with \r\n line endings (see https://github.com/openpgpjs/openpgpjs/pull/1548).
 * In order to verify the signatures generated over the incorrectly normalised data, we fallback to not normalising the input.
 * Currently, this is done inside the CryptoProxy, to transparently track the number of signatures that are affected throughout the apps.
 * @param options - verification options, with `date` already set to server time
 */
async function verifyMessageWithFallback<
    DataType extends string | Uint8Array,
    FormatType extends WorkerVerifyOptions<DataType>['format'] = 'utf8'
>(options: WorkerVerifyOptions<DataType> & { format?: FormatType }) {
    const verificationResult = await assertNotNull(endpoint).verifyMessage<DataType, FormatType>(options);

    const { textData, stripTrailingSpaces } = options;
    if (
        verificationResult.verified === VERIFICATION_STATUS.SIGNED_AND_INVALID &&
        stripTrailingSpaces &&
        textData &&
        verificationResult.data !== textData // detect whether some normalisation was applied
    ) {
        const fallbackverificationResult = await assertNotNull(endpoint).verifyMessage<string, FormatType>({
            ...options,
            binaryData: undefined,
            stripTrailingSpaces: false,
        });

        if (fallbackverificationResult.verified === VERIFICATION_STATUS.SIGNED_AND_VALID) {
            captureMessage('Fallback verification needed', {
                level: 'info',
            });
            return fallbackverificationResult;
        }
    }

    return verificationResult;
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

    encryptMessage: async ({ date = serverTime(), ...opts }) =>
        assertNotNull(endpoint).encryptMessage({ ...opts, date }),
    decryptMessage: async ({ date = serverTime(), ...opts }) =>
        assertNotNull(endpoint).decryptMessage({ ...opts, date }),
    decryptMessageLegacy: async ({ date = serverTime(), ...opts }) =>
        assertNotNull(endpoint).decryptMessageLegacy({ ...opts, date }),
    signMessage: async ({ date = serverTime(), ...opts }) => assertNotNull(endpoint).signMessage({ ...opts, date }),
    verifyMessage: async ({ date = serverTime(), ...opts }) => verifyMessageWithFallback({ ...opts, date }),
    verifyCleartextMessage: async ({ date = serverTime(), ...opts }) =>
        assertNotNull(endpoint).verifyCleartextMessage({ ...opts, date }),
    processMIME: async ({ date = serverTime(), ...opts }) => assertNotNull(endpoint).processMIME({ ...opts, date }),

    generateSessionKey: async ({ date = serverTime(), ...opts }) =>
        assertNotNull(endpoint).generateSessionKey({ ...opts, date }),
    generateSessionKeyForAlgorithm: async (opts) => assertNotNull(endpoint).generateSessionKeyForAlgorithm(opts),
    encryptSessionKey: async ({ date = serverTime(), ...opts }) =>
        assertNotNull(endpoint).encryptSessionKey({ ...opts, date }),
    decryptSessionKey: async ({ date = serverTime(), ...opts }) =>
        assertNotNull(endpoint).decryptSessionKey({ ...opts, date }),

    importPrivateKey: async (opts) => assertNotNull(endpoint).importPrivateKey(opts),
    importPublicKey: async (opts) => assertNotNull(endpoint).importPublicKey(opts),
    generateKey: async ({ date = serverTime(), ...opts }) => assertNotNull(endpoint).generateKey({ ...opts, date }),
    reformatKey: async ({ date = serverTime(), ...opts }) => assertNotNull(endpoint).reformatKey({ ...opts, date }),
    exportPublicKey: async (opts) => assertNotNull(endpoint).exportPublicKey(opts),
    exportPrivateKey: async (opts) => assertNotNull(endpoint).exportPrivateKey(opts),
    clearKeyStore: () => assertNotNull(endpoint).clearKeyStore(),
    clearKey: async (opts) => assertNotNull(endpoint).clearKey(opts),
    replaceUserIDs: async (opts) => assertNotNull(endpoint).replaceUserIDs(opts),

    isRevokedKey: async ({ date = serverTime(), ...opts }) => assertNotNull(endpoint).isRevokedKey({ ...opts, date }),
    isExpiredKey: async ({ date = serverTime(), ...opts }) => assertNotNull(endpoint).isExpiredKey({ ...opts, date }),
    canKeyEncrypt: async ({ date = serverTime(), ...opts }) => assertNotNull(endpoint).canKeyEncrypt({ ...opts, date }),
    getSHA256Fingerprints: async (opts) => assertNotNull(endpoint).getSHA256Fingerprints(opts),
    computeHash: async (opts) => assertNotNull(endpoint).computeHash(opts),

    getArmoredMessage: async (opts) => assertNotNull(endpoint).getArmoredMessage(opts),
    getArmoredKeys: async (opts) => assertNotNull(endpoint).getArmoredKeys(opts),
    getArmoredSignature: async (opts) => assertNotNull(endpoint).getArmoredSignature(opts),
    getSignatureInfo: async (opts) => assertNotNull(endpoint).getSignatureInfo(opts),
    getMessageInfo: async (opts) => assertNotNull(endpoint).getMessageInfo(opts),
    getKeyInfo: async (opts) => assertNotNull(endpoint).getKeyInfo(opts),
};
