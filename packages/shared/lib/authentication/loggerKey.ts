import { type AesGcmCryptoKey, deriveKey as deriveAesGcmKey } from '@proton/crypto/lib/subtle/aesGcm';
import { stringToUtf8Array } from '@proton/crypto/lib/utils';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import { uint8ArrayToBase64String } from '../helpers/encoding';
import { getParsedClientKey } from './clientKey';
import type { AuthenticationStore } from './createAuthenticationStore';

export type LoggerKey = AesGcmCryptoKey;
const HKDF_INFO = stringToUtf8Array('web-logger-key'); // context identifier for domain separation

export interface GeneratedLoggerKey {
    key: LoggerKey;
    /**
     * The ID uniquely identifies a logger key and it is not secret/confidential:
     * it can thus be used to e.g. label data encrypted with the key.
     * The ID will only change if the logger key has also changed.
     */
    ID: string;
}

/**
 * A logger key is meant to encrypt app logs stored locally (either in indexDB or local storage).
 * It's bound to the user and the session: it persists on account switch but not on logout.
 */
export const generateLoggerKey = async (authentication: AuthenticationStore): Promise<GeneratedLoggerKey> => {
    const clientKey = authentication.getClientKey();
    if (!clientKey) {
        // sanity check, not expected
        throw new Error('Missing clientKey');
    }
    const clientKeyBytes = getParsedClientKey(clientKey);
    // random and bound to the session (same lifetime as the clientKey);
    // technically this salt is not necessary but it does not hurt either
    const salt = stringToUtf8Array(authentication.UID);

    const [loggerKeyBoundToSession, loggerKeyID] = await Promise.all([
        // We run a key derivation step (HKDF) to get a new AES-GCM key bound to the UID
        deriveAesGcmKey(clientKeyBytes, salt, HKDF_INFO),
        // Not using the CryptoProxy since the logger might be initialized earlier on.
        crypto.subtle
            .digest('SHA-256', mergeUint8Arrays([HKDF_INFO, salt]))
            .then((bytes) => uint8ArrayToBase64String(new Uint8Array(bytes))),
    ]);

    return {
        key: loggerKeyBoundToSession,
        ID: loggerKeyID,
    };
};
