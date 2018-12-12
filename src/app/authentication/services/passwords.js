import bcrypt from 'bcryptjs';
import { arrayToBinaryString, binaryStringToArray, decodeBase64, encodeBase64, encodeUtf8 } from 'pmcrypto';

import { getRandomValues } from '../../../helpers/webcrypto';

/* @ngInject */
function passwords($q, gettextCatalog) {
    function bcryptHelper(str, salt) {
        const deferred = $q.defer();
        bcrypt.hash(str, salt, (err, hash) => {
            if (typeof hash !== 'string') {
                deferred.reject(err);
            } else {
                deferred.resolve(hash);
            }
        });
        return deferred.promise;
    }

    function cleanUsername(name) {
        return name.replace(/\.|-|_/g, '').toLowerCase();
    }

    async function expandHash(str) {
        const list = await Promise.all([
            openpgp.crypto.hash.sha512(binaryStringToArray(str + '\x00')),
            openpgp.crypto.hash.sha512(binaryStringToArray(str + '\x01')),
            openpgp.crypto.hash.sha512(binaryStringToArray(str + '\x02')),
            openpgp.crypto.hash.sha512(binaryStringToArray(str + '\x03'))
        ]);

        return openpgp.util.concatUint8Array(list);
    }

    function computeKeyPassword(password, salt) {
        if (salt && salt.length) {
            const saltBinary = binaryStringToArray(decodeBase64(salt));
            return bcryptHelper(password, '$2y$10$' + bcrypt.encodeBase64(saltBinary, 16)).then((hash) => {
                // Remove bcrypt prefix and salt (first 29 characters)
                return hash.slice(29);
            });
        }

        // No salt, old-style
        const deferred = $q.defer();
        deferred.resolve(password);
        return deferred.promise;
    }

    function generateKeySalt() {
        return encodeBase64(arrayToBinaryString(getRandomValues(new Uint8Array(16))));
    }

    const hashPasswordVersion = {
        4(password, salt, modulus) {
            return hashPasswordVersion[3](password, salt, modulus);
        },

        3(password, salt, modulus) {
            const saltBinary = binaryStringToArray(salt + 'proton');
            // We use the latest version of bcrypt, 2y, with 2^10 rounds.
            return bcryptHelper(password, '$2y$10$' + bcrypt.encodeBase64(saltBinary, 16)).then((unexpandedHash) => {
                return expandHash(unexpandedHash + arrayToBinaryString(modulus));
            });
        },

        2(password, userName, modulus) {
            return hashPasswordVersion[1](password, cleanUsername(userName), modulus);
        },

        async 1(password, userName, modulus) {
            const salt = await openpgp.crypto.hash.md5(binaryStringToArray(encodeUtf8(userName.toLowerCase())));
            let encodedSalt = '';
            for (let i = 0; i < salt.length; i++) {
                let byte = salt[i].toString(16);
                if (byte.length === 1) {
                    byte = '0' + byte;
                }
                encodedSalt += byte;
            }
            // See hash version 3 for explanation of the prefix
            return bcryptHelper(password, '$2y$10$' + encodedSalt).then((unexpandedHash) => {
                return expandHash(unexpandedHash + arrayToBinaryString(modulus));
            });
        },

        async 0(password, userName, modulus) {
            const hash = await openpgp.crypto.hash.sha512(
                binaryStringToArray(userName.toLowerCase() + encodeUtf8(password))
            );
            const prehashed = encodeBase64(arrayToBinaryString(hash));
            return hashPasswordVersion[1](prehashed, userName, modulus);
        }
    };

    const api = {
        currentAuthVersion: 4,
        cleanUsername,
        expandHash,
        hashPassword({ version, password, salt, username, modulus }) {
            switch (version) {
                case 4:
                case 3:
                    return hashPasswordVersion[version](password, salt, modulus);
                case 2:
                case 1:
                case 0:
                    return hashPasswordVersion[version](password, username, modulus);
                default:
                    $q.reject({ message: gettextCatalog.getString('Unsupported auth version', null, 'Error') });
                    break;
            }
        },
        computeKeyPassword,
        generateKeySalt
    };

    return api;
}
export default passwords;
