import {
    DEFAULT_KEY_GENERATION_OFFSET,
    DEFAULT_SIGNATURE_VERIFICATION_OFFSET,
    VERIFICATION_STATUS,
} from 'pmcrypto/lib/constants';

import { captureMessage } from '@proton/shared/lib/helpers/sentry';

import { serverTime } from '../serverTime';
import type { ApiInterface } from '../worker/api';
import type { WorkerVerifyOptions } from '../worker/api.models';

export type CryptoApiInterface = ApiInterface;

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
    DataType extends string | Uint8Array<ArrayBuffer>,
    FormatType extends WorkerVerifyOptions<DataType>['format'] = 'utf8',
>(options: WorkerVerifyOptions<DataType> & { format?: FormatType }) {
    const verificationResult = await assertNotNull(endpoint).verifyMessage<DataType, FormatType>(options);

    const { textData, stripTrailingSpaces } = options;
    if (
        verificationResult.verificationStatus === VERIFICATION_STATUS.SIGNED_AND_INVALID &&
        stripTrailingSpaces &&
        textData &&
        verificationResult.data !== textData // detect whether some normalisation was applied
    ) {
        const fallbackverificationResult = await assertNotNull(endpoint).verifyMessage<string, FormatType>({
            ...options,
            binaryData: undefined,
            stripTrailingSpaces: false,
        });

        if (fallbackverificationResult.verificationStatus === VERIFICATION_STATUS.SIGNED_AND_VALID) {
            captureMessage('Fallback verification needed', {
                level: 'info',
            });
            return fallbackverificationResult;
        }

        // detect whether the message has trailing spaces followed by a mix of \r\n and \n line endings
        const legacyRemoveTrailingSpaces = (text: string) => {
            return text
                .split('\n')
                .map((line) => {
                    let i = line.length - 1;
                    for (; i >= 0 && (line[i] === ' ' || line[i] === '\t'); i--) {}
                    return line.substr(0, i + 1);
                })
                .join('\n');
        };

        if (textData !== legacyRemoveTrailingSpaces(textData)) {
            captureMessage('Fallback verification insufficient', {
                level: 'info',
            });
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
    decryptMessage: async ({ date = new Date(+serverTime() + DEFAULT_SIGNATURE_VERIFICATION_OFFSET), ...opts }) =>
        assertNotNull(endpoint).decryptMessage({ ...opts, date }),
    signMessage: async ({ date = serverTime(), ...opts }) => assertNotNull(endpoint).signMessage({ ...opts, date }),
    verifyMessage: async ({ date = new Date(+serverTime() + DEFAULT_SIGNATURE_VERIFICATION_OFFSET), ...opts }) =>
        verifyMessageWithFallback({ ...opts, date }),
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
    generateKey: async ({ date = new Date(+serverTime() + DEFAULT_KEY_GENERATION_OFFSET), ...opts }) =>
        assertNotNull(endpoint).generateKey({ ...opts, date }),
    reformatKey: async ({ privateKey, date = privateKey.getCreationTime(), ...opts }) =>
        assertNotNull(endpoint).reformatKey({ ...opts, privateKey, date }),
    exportPublicKey: async (opts) => assertNotNull(endpoint).exportPublicKey(opts),
    exportPrivateKey: async (opts) => assertNotNull(endpoint).exportPrivateKey(opts),
    clearKeyStore: () => assertNotNull(endpoint).clearKeyStore(),
    clearKey: async (opts) => assertNotNull(endpoint).clearKey(opts),
    replaceUserIDs: async (opts) => assertNotNull(endpoint).replaceUserIDs(opts),
    cloneKeyAndChangeUserIDs: async (opts) => assertNotNull(endpoint).cloneKeyAndChangeUserIDs(opts),
    generateE2EEForwardingMaterial: async ({ date = serverTime(), ...opts }) =>
        assertNotNull(endpoint).generateE2EEForwardingMaterial({ ...opts, date }),
    doesKeySupportE2EEForwarding: async ({ date = serverTime(), ...opts }) =>
        assertNotNull(endpoint).doesKeySupportE2EEForwarding({ ...opts, date }),
    isE2EEForwardingKey: async ({ date = serverTime(), ...opts }) =>
        assertNotNull(endpoint).isE2EEForwardingKey({ ...opts, date }),

    isRevokedKey: async ({ date = serverTime(), ...opts }) => assertNotNull(endpoint).isRevokedKey({ ...opts, date }),
    isExpiredKey: async ({ date = serverTime(), ...opts }) => assertNotNull(endpoint).isExpiredKey({ ...opts, date }),
    canKeyEncrypt: async ({ date = serverTime(), ...opts }) => assertNotNull(endpoint).canKeyEncrypt({ ...opts, date }),
    computeHash: async (opts) => assertNotNull(endpoint).computeHash(opts),
    computeHashStream: async (opts) => assertNotNull(endpoint).computeHashStream(opts),
    computeArgon2: (opts) => assertNotNull(endpoint).computeArgon2(opts),

    getArmoredMessage: async (opts) => assertNotNull(endpoint).getArmoredMessage(opts),
    getArmoredKeys: async (opts) => assertNotNull(endpoint).getArmoredKeys(opts),
    getArmoredSignature: async (opts) => assertNotNull(endpoint).getArmoredSignature(opts),
    getSignatureInfo: async (opts) => assertNotNull(endpoint).getSignatureInfo(opts),
    getMessageInfo: async (opts) => assertNotNull(endpoint).getMessageInfo(opts),
    getKeyInfo: async (opts) => assertNotNull(endpoint).getKeyInfo(opts),
};
