import { authentication } from '@proton/pass/auth/authentication';
import { ENCRYPTION_ALGORITHM } from '@proton/shared/lib/authentication/cryptoHelper';
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';

const KEY_ALGORITHM = { name: 'AES-GCM', length: 256 };
export const CACHE_SALT_LENGTH = 32;

const HKDF_PARAMS: Omit<HkdfParams, 'salt'> = {
    name: 'HKDF',
    hash: 'SHA-256',
    info: stringToUint8Array('pass-extension-cache-key'), // context identifier for domain separation
};

/**
 * Get key to use for cache encryption.
 * NB: this function does not take an arbitrary key/password in input because it relies on a key derivation step
 * that is only secure enough in some cases.
 * @param salt - randomly generated salt of `SALT_LENGTH` size, ideally regenerated at each snapshot
 * @returns key to use with `encryptData` and `decryptData`
 */
export const getCacheEncryptionKey = async (salt: Uint8Array, sessionLockToken?: string): Promise<CryptoKey> => {
    // sanity check to avoid problems when using the key
    if (ENCRYPTION_ALGORITHM !== KEY_ALGORITHM.name) {
        throw new Error('Key algorithm does not match encryption algorithm');
    }
    // We run a key derivation step (HKDF) to achieve domain separation (preventing the encrypted data to be
    // decrypted outside of the booting context) and to better protect the password in case of e.g.
    // future GCM key-recovery attacks.
    // Since the password is already salted using bcrypt, we consider it entropic enough for HKDF: see
    // discussion on key-stretching step in https://eprint.iacr.org/2010/264.pdf (Section 9).
    const saltedUserPassword = `${authentication.getPassword()}${sessionLockToken ?? ''}`;
    const passwordBytes = stringToUint8Array(saltedUserPassword);
    const keyToSalt = await crypto.subtle.importKey('raw', passwordBytes.buffer, HKDF_PARAMS.name, false, [
        'deriveKey',
    ]);
    return crypto.subtle.deriveKey(
        {
            ...HKDF_PARAMS,
            salt,
        },
        keyToSalt,
        KEY_ALGORITHM,
        false,
        ['decrypt', 'encrypt']
    );
};
