import { ARGON2_PARAMS, CryptoProxy } from '@proton/crypto/lib';
import { encryptData, generateKey, getSymmetricKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { PassCryptoError } from '@proton/pass/lib/crypto/utils/errors';
import { type Maybe, PassEncryptionTag } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { ENCRYPTION_ALGORITHM } from '@proton/shared/lib/authentication/cryptoHelper';
import { stringToUint8Array, uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';

type Argon2Params = (typeof ARGON2_PARAMS)[keyof typeof ARGON2_PARAMS];

export type OfflineConfig = { salt: string; params: Argon2Params };

export type OfflineComponents = {
    /** Argon2 derivation of the user password. Kept encrypted
     * in the persisted session blob. */
    offlineKD: string;
    /** The salt & argon2 parameters used to generated the offline
     * key derivation. Defaults to `ARGON2_PARAMS.RECOMMENDED` */
    offlineConfig: OfflineConfig;
    /** A random 32 bytes string encrypted with the offlineKD.
     * Allows verifying a local password via argon2 derivation. */
    offlineVerifier: string;
};

const KEY_ALGORITHM = { name: 'AES-GCM', length: 256 };
export const CACHE_SALT_LENGTH = 32;

const HKDF_PARAMS: Omit<HkdfParams, 'salt'> = {
    name: 'HKDF',
    hash: 'SHA-256',
    info: stringToUint8Array('pass-extension-cache-key'), // context identifier for domain separation
};

/**
 * Get the key to use for local cache encryption. We use a HKDF derivation
 * step since `keyPassword` has high entropy as it is salted using bcrypt.
 * HKDF derivation would not be secure otherwise.
 * @param salt - randomly generated salt of `SALT_LENGTH` size, ideally regenerated at each snapshot
 * @returns key to use with `encryptData` and `decryptData`
 */
export const getCacheEncryptionKey = async (
    keyPassword: string,
    salt: Uint8Array,
    sessionLockToken: Maybe<string>
): Promise<CryptoKey> => {
    /* sanity check to avoid problems when using the key */
    if (ENCRYPTION_ALGORITHM !== KEY_ALGORITHM.name) {
        throw new Error('Key algorithm does not match encryption algorithm');
    }

    // We run a key derivation step (HKDF) to achieve domain separation (preventing the encrypted data to be
    // decrypted outside of the booting context) and to better protect the password in case of e.g.
    // future GCM key-recovery attacks.
    // Since the password is already salted using bcrypt, we consider it entropic enough for HKDF: see
    // discussion on key-stretching step in https://eprint.iacr.org/2010/264.pdf (Section 9).
    const saltedUserPassword = `${keyPassword}${sessionLockToken ?? ''}`;
    const passwordBytes = stringToUint8Array(saltedUserPassword);
    const keyToSalt = await crypto.subtle.importKey('raw', passwordBytes.buffer, HKDF_PARAMS.name, false, [
        'deriveKey',
    ]);

    const cacheEncryptionKey = await crypto.subtle.deriveKey(
        {
            ...HKDF_PARAMS,
            salt,
        },
        keyToSalt,
        KEY_ALGORITHM,
        true, // exportable in order to re-encrypt for offline
        ['decrypt', 'encrypt']
    );

    return cacheEncryptionKey;
};

export const OFFLINE_ARGON2_PARAMS = ARGON2_PARAMS.RECOMMENDED;

/** Computes the raw bytes of the offline key by deriving it using an Argon2 algorithm
 * from the encryption password and a randomly generated salt. The encryption password
 * refers to the plain-text secondary password - typically the user's master password in
 * one-password mode - for future-proofing against SSO support and two-password mode. */
export const getOfflineKeyDerivation = async (
    loginPassword: string,
    salt: Uint8Array,
    params: Argon2Params = OFFLINE_ARGON2_PARAMS
): Promise<Uint8Array> => CryptoProxy.computeArgon2({ params, password: loginPassword, salt });

/** Encrypts the raw cache key with the offline key */
export const encryptOfflineCacheKey = async (cacheKey: CryptoKey, offlineKD: Uint8Array): Promise<Uint8Array> => {
    const rawCacheKey = await crypto.subtle.exportKey('raw', cacheKey);
    const offlineKey = await getSymmetricKey(offlineKD);

    return encryptData(offlineKey, new Uint8Array(rawCacheKey), PassEncryptionTag.Offline);
};

export const getOfflineVerifier = async (offlineKD: Uint8Array): Promise<string> => {
    const offlineKey = await getSymmetricKey(offlineKD);
    const verifier = generateKey();
    const offlineVerifier = await encryptData(offlineKey, verifier, PassEncryptionTag.Offline);

    return uint8ArrayToString(offlineVerifier);
};

export const getOfflineComponents = async (loginPassword: string): Promise<OfflineComponents> => {
    const offlineSalt = crypto.getRandomValues(new Uint8Array(CACHE_SALT_LENGTH));

    const offlineKD = await getOfflineKeyDerivation(loginPassword, offlineSalt).catch((error) => {
        logger.warn(`[Argon2] Offline derivation error`, error);
        throw new PassCryptoError('Argon2 failure');
    });

    return {
        offlineConfig: { salt: uint8ArrayToString(offlineSalt), params: OFFLINE_ARGON2_PARAMS },
        offlineKD: uint8ArrayToString(offlineKD),
        offlineVerifier: await getOfflineVerifier(offlineKD),
    };
};
