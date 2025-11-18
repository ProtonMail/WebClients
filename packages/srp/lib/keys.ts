import { encodeBase64 as bcryptEncodeBase64, hash as bcryptHash } from 'bcryptjs';

import { BCRYPT_PREFIX } from './constants';

/**
 * Compute the key password.
 */
export const computeKeyPassword = async (password: string, salt: string) => {
    if (!password || !salt || salt.length !== 24 || password.length < 1) {
        throw new Error('Password and salt required.');
    }
    const saltBinary = Uint8Array.fromBase64(salt);
    const hash = await bcryptHash(password, BCRYPT_PREFIX + bcryptEncodeBase64(saltBinary, 16));
    // Remove bcrypt prefix and salt (first 29 characters)
    return hash.slice(29);
};

/**
 * Generate salt for a key.
 */
export const generateKeySalt = () => crypto.getRandomValues(new Uint8Array(16)).toBase64();
