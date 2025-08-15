import { encodeBase64 as bcryptEncodeBase64, hash as bcryptHash } from 'bcryptjs';

import { CryptoProxy } from '@proton/crypto';
import {
    arrayToBinaryString,
    arrayToHexString,
    binaryStringToArray,
    encodeBase64,
    encodeUtf8,
} from '@proton/crypto/lib/utils';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import { BCRYPT_PREFIX } from './constants';
import { cleanUsername } from './utils/username';

/**
 * Expand a hash
 */
export const expandHash = async (input: Uint8Array<ArrayBuffer>) => {
    const promises = [];
    const arr = mergeUint8Arrays([input, new Uint8Array([0])]);
    for (let i = 1; i <= 4; i++) {
        promises.push(CryptoProxy.computeHash({ algorithm: 'SHA512', data: arr }));
        arr[arr.length - 1] = i;
    }
    return mergeUint8Arrays(await Promise.all(promises));
};

/**
 * Format a hash
 */
const formatHash = async (password: string, salt: string, modulus: Uint8Array<ArrayBuffer>) => {
    const unexpandedHash = await bcryptHash(password, BCRYPT_PREFIX + salt);
    return expandHash(mergeUint8Arrays([binaryStringToArray(unexpandedHash), modulus]));
};

/**
 * Hash password in version 3.
 */
const hashPassword3 = (password: string, salt: string, modulus: Uint8Array<ArrayBuffer>) => {
    const saltBinary = binaryStringToArray(`${salt}proton`);
    return formatHash(password, bcryptEncodeBase64(saltBinary, 16), modulus);
};

/**
 * Hash password in version 1.
 */
const hashPassword1 = async (password: string, username: string, modulus: Uint8Array<ArrayBuffer>) => {
    const value = binaryStringToArray(encodeUtf8(username.toLowerCase()));
    const salt = arrayToHexString(await CryptoProxy.computeHash({ algorithm: 'unsafeMD5', data: value }));
    return formatHash(password, salt, modulus);
};

/**
 * Hash password in version 0.
 */
const hashPassword0 = async (password: string, username: string, modulus: Uint8Array<ArrayBuffer>) => {
    const value = await CryptoProxy.computeHash({
        algorithm: 'SHA512',
        data: binaryStringToArray(username.toLowerCase() + encodeUtf8(password)),
    });
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
