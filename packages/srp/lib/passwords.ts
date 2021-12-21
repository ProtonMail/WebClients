import bcrypt from 'bcryptjs';
import {
    arrayToBinaryString,
    arrayToHexString,
    binaryStringToArray,
    concatArrays,
    encodeBase64,
    encodeUtf8,
    SHA512,
    unsafeMD5,
} from 'pmcrypto';

import { cleanUsername } from './utils/username';
import { BCRYPT_PREFIX } from './constants';

/**
 * Expand a hash
 */
export const expandHash = async (input: Uint8Array) => {
    const promises = [];
    const arr = concatArrays([input, new Uint8Array([0])]);
    for (let i = 1; i <= 4; i++) {
        promises.push(SHA512(arr));
        arr[arr.length - 1] = i;
    }
    return concatArrays(await Promise.all(promises));
};

/**
 * Format a hash
 */
const formatHash = async (password: string, salt: string, modulus: Uint8Array) => {
    const unexpandedHash = await bcrypt.hash(password, BCRYPT_PREFIX + salt);
    return expandHash(concatArrays([binaryStringToArray(unexpandedHash), modulus]));
};

/**
 * Hash password in version 3.
 */
const hashPassword3 = (password: string, salt: string, modulus: Uint8Array) => {
    const saltBinary = binaryStringToArray(`${salt}proton`);
    return formatHash(password, bcrypt.encodeBase64(saltBinary, 16), modulus);
};

/**
 * Hash password in version 1.
 */
const hashPassword1 = async (password: string, username: string, modulus: Uint8Array) => {
    const value = binaryStringToArray(encodeUtf8(username.toLowerCase()));
    const salt = arrayToHexString(await unsafeMD5(value));
    return formatHash(password, salt, modulus);
};

/**
 * Hash password in version 0.
 */
const hashPassword0 = async (password: string, username: string, modulus: Uint8Array) => {
    const value = await SHA512(binaryStringToArray(username.toLowerCase() + encodeUtf8(password)));
    const prehashed = encodeBase64(arrayToBinaryString(value));
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
    modulus: Uint8Array;
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
