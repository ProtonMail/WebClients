import { encodeBase64 as bcryptEncodeBase64, hash as bcryptHash } from 'bcryptjs';

import { CryptoProxy } from '@proton/crypto';
import { binaryStringToUint8Array, stringToUtf8Array } from '@proton/crypto/lib/utils';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import { BCRYPT_PREFIX } from './constants';
import { cleanUsername } from './utils/username';

/**
 * Expand a hash
 */
export const expandHash = async (input: Uint8Array<ArrayBuffer>) => {
    const promises = new Array(4).fill(null).map((_, i) =>
        CryptoProxy.computeHash({
            algorithm: 'SHA512',
            data: mergeUint8Arrays([input, new Uint8Array([i])]),
        })
    );
    return mergeUint8Arrays(await Promise.all(promises));
};

/**
 * Format a hash
 */
const formatHash = async (password: string, salt: string, modulus: Uint8Array<ArrayBuffer>) => {
    const unexpandedHash = await bcryptHash(password, BCRYPT_PREFIX + salt);
    return expandHash(mergeUint8Arrays([binaryStringToUint8Array(unexpandedHash), modulus]));
};

/**
 * Hash password in version 3.
 */
const hashPassword3 = (password: string, salt: string, modulus: Uint8Array<ArrayBuffer>) => {
    const saltBinary = binaryStringToUint8Array(`${salt}proton`);
    return formatHash(password, bcryptEncodeBase64(saltBinary, 16), modulus);
};

/**
 * Hash password in version 1.
 */
const hashPassword1 = async (password: string, username: string, modulus: Uint8Array<ArrayBuffer>) => {
    const value = stringToUtf8Array(username.toLowerCase());
    const salt = (await CryptoProxy.computeHash({ algorithm: 'unsafeMD5', data: value })).toHex();
    return formatHash(password, salt, modulus);
};

/**
 * Hash password in version 0.
 */
const hashPassword0 = async (password: string, username: string, modulus: Uint8Array<ArrayBuffer>) => {
    const value = await CryptoProxy.computeHash({
        algorithm: 'SHA512',
        data: stringToUtf8Array(username.toLowerCase() + password),
    });
    const prehashed = value.toBase64();
    return hashPassword1(prehashed, username, modulus);
};

/**
 * Hash a password.
 */
export const hashPassword = ({
    password,
    salt,
    username,
    modulus,
    version,
}: {
    password: string;
    salt?: string;
    username?: string;
    modulus: Uint8Array<ArrayBuffer>;
    version: number;
}) => {
    if (version === 4 || version === 3) {
        if (!salt) {
            throw new Error('Missing salt');
        }
        return hashPassword3(password, salt, modulus);
    }

    if (version === 2) {
        return hashPassword1(password, cleanUsername(username), modulus);
    }

    if (version === 1) {
        if (!username) {
            throw new Error('Missing username');
        }
        return hashPassword1(password, username, modulus);
    }

    if (version === 0) {
        if (!username) {
            throw new Error('Missing username');
        }
        return hashPassword0(password, username, modulus);
    }

    throw new Error('Unsupported auth version');
};
