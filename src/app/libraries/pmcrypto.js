/*
 * Be VERY careful about changing this file. It is used in both the browser JS package and in the node.js encryption server
 * Just because your changes work in the browser does not mean they work in the encryption server!
 */

if (typeof module !== 'undefined' && module.exports) {
    // node.js
    /* eslint { "no-global-assign": "off", "import/no-extraneous-dependencies": "off", "import/no-unresolved": "off", "global-require" : "off" } */
    btoa = require('btoa');
    atob = require('atob');
    Promise = require('es6-promise').Promise;
    openpgp = require('./openpgp.min.js');
} else {
    // Browser
    openpgp.config.integrity_protect = true;
    openpgp.initWorker({ path: 'openpgp.worker.min.js' });
}

openpgp.config.integrity_protect = true;
openpgp.config.use_native = true;

const pmcrypto = (function pmcrypto() {

    // Deprecated, backwards compatibility
    const protonmailCryptoHeaderMessage = '---BEGIN ENCRYPTED MESSAGE---';
    const protonmailCryptoTailMessage = '---END ENCRYPTED MESSAGE---';
    const protonmailCryptoHeaderRandomKey = '---BEGIN ENCRYPTED RANDOM KEY---';
    const protonmailCryptoTailRandomKey = '---END ENCRYPTED RANDOM KEY---';

    function getEncMessageFromEmailPM(EmailPM) {
        if (EmailPM !== undefined && typeof EmailPM.search === 'function') {
            const begin = EmailPM.search(protonmailCryptoHeaderMessage) + protonmailCryptoHeaderMessage.length;
            const end = EmailPM.search(protonmailCryptoTailMessage);
            if (begin === -1 || end === -1) return '';
            return EmailPM.substring(begin, end);
        }
        return '';
    }

    function getEncRandomKeyFromEmailPM(EmailPM) {
        if (EmailPM !== undefined && typeof EmailPM.search === 'function') {
            const begin = EmailPM.search(protonmailCryptoHeaderRandomKey) + protonmailCryptoHeaderRandomKey.length;
            const end = EmailPM.search(protonmailCryptoTailRandomKey);
            if (begin === -1 || end === -1) return '';
            return EmailPM.substring(begin, end);
        }
        return '';
    }

    // Backwards-compatible decrypt RSA message function
    function decryptMessageRSA(encMessage, privKey, messageTime, pubKeys) {
        return new Promise((resolve, reject) => {

            if (encMessage === undefined || encMessage === '') {
                return reject(new Error('Missing encrypted message'));
            }
            if (privKey === undefined || privKey === '') {
                return reject(new Error('Missing private key'));
            }
            if (messageTime === undefined || messageTime === '') {
                return reject(new Error('Missing message time'));
            }

            let oldEncMessage = getEncMessageFromEmailPM(encMessage);
            const oldEncRandomKey = getEncRandomKeyFromEmailPM(encMessage);

            // OpenPGP
            if (oldEncMessage === '' || oldEncRandomKey === '') return resolve(decryptMessage(encMessage, privKey, false, null, pubKeys));

            // Old message encryption format
            resolve(decryptMessage(oldEncRandomKey, privKey, false)
                .then(decode_utf8_base64)
                .then(pmcrypto.binaryStringToArray)
                .then((randomKey) => {

                    if (randomKey.length === 0) {
                        return Promise.reject(new Error('Random key is empty'));
                    }

                    oldEncMessage = pmcrypto.binaryStringToArray(pmcrypto.decode_utf8_base64({ message: oldEncMessage }));

                    let decryptedMessage;
                    try {
                        // cutoff time for enabling multilanguage support
                        if (messageTime > 1399086120) {
                            decryptedMessage = decode_utf8_base64({ message: pmcrypto.arrayToBinaryString(openpgp.crypto.cfb.decrypt('aes256', randomKey, oldEncMessage, true)) });
                        } else {
                            decryptedMessage = pmcrypto.arrayToBinaryString(openpgp.crypto.cfb.decrypt('aes256', randomKey, oldEncMessage, true));
                        }
                    } catch (err) {
                        return Promise.reject(err);
                    }
                    return decryptedMessage;
                }));
        });
    }

    // Current
    function encode_utf8(data) {
        if (data !== undefined) return unescape(encodeURIComponent(data));
    }

    function decode_utf8(data) {
        if (data !== undefined) return decodeURIComponent(escape(data));
    }

    function encode_base64(data) {
        if (data !== undefined) return btoa(data).trim();
    }

    function decode_base64(data) {
        if (data !== undefined) return atob(data.trim());
    }

    function encode_utf8_base64(data) {
        if (data !== undefined) return encode_base64(encode_utf8(data));
    }

    function decode_utf8_base64(data) {
        if (data !== undefined) {
            if (data.message !== undefined) {
                return decode_utf8(decode_base64(data.message));
            }
            return decode_utf8(decode_base64(data));
        }
    }

    function generateKeysRSA(email = '', passphrase = '', numBits = 2048) {

        if (passphrase.length === 0) {
            return Promise.reject('Missing private key passcode');
        }

        const user = {
            name: email,
            email
        };

        return openpgp.generateKey({
            numBits,
            userIds: [user],
            passphrase
        });
    }

    function generateKeyAES() {
        return openpgp.crypto.generateSessionKey('aes256');
    }

    function getKeys(armoredKeys = '') {
        let keys;
        try {
            keys = openpgp.key.readArmored(armoredKeys);
        } catch (err) {
            return err;
        }

        if (keys === undefined) {
            return new Error('Cannot parse key(s)');
        }
        if (keys.err) {
            // openpgp.key.readArmored returns error arrays.
            return new Error(keys.err[0].message);
        }
        if (keys.keys.length < 1 || keys.keys[0] === undefined) {
            return new Error('Invalid key(s)');
        }

        return keys.keys;
    }

    // privKeys is optional - will also sign the message
    function encryptMessage(message = '', pubKeys = '', passwords = [], privKeys = []) {
        return new Promise((resolve, reject) => {
            if (message === undefined) {
                return reject(new Error('Missing data'));
            }
            if (pubKeys === undefined && passwords === undefined) {
                return reject(new Error('Missing key'));
            }

            const options = {
                data: message,
                armor: true
            };

            if (pubKeys && pubKeys.length) {
                const keys = getKeys(pubKeys);
                if (keys instanceof Error) return reject(keys);
                options.publicKeys = keys;
            }

            if (passwords) {
                if (!(passwords instanceof Array)) {
                    options.passwords = [passwords];
                } else {
                    options.passwords = passwords;
                }
            }

            if (privKeys) {
                options.privateKeys = privKeys[0];
            }

            openpgp.encrypt(options).then((ciphertext) => {
                resolve(ciphertext.data);
            });
        });
    }

    // when attachment signing is implemented, use the privKeys parameter
    function encryptFile(data, pubKeys, passwords, filename, privKeys) {
        return new Promise((resolve, reject) => {
            if (data === undefined) {
                return reject(new Error('Missing data'));
            }
            if (pubKeys === undefined && passwords === undefined) {
                return reject(new Error('Missing key'));
            }

            const options = {
                filename,
                data,
                armor: false
            };

            if (pubKeys && pubKeys.length) {
                const keys = getKeys(pubKeys);
                if (keys instanceof Error) return reject(keys);
                options.publicKeys = keys;
            }

            if (passwords) {
                if (!(passwords instanceof Array)) {
                    options.passwords = [passwords];
                } else {
                    options.passwords = passwords;
                }
            }

            if (privKeys) {
                // Sign with primary (first) key in array
                options.privateKeys = privKeys[0];
            }

            openpgp.encrypt(options).then((ciphertext) => {
                resolve(splitFile(ciphertext.message));
            });
        });

    }

    function encryptSessionKey(sessionKey, algo, pubKeys, passwords) {

        return new Promise((resolve, reject) => {
            if (sessionKey === undefined) {
                return reject(new Error('Missing session key'));
            }
            if (algo === undefined) {
                return reject(new Error('Missing session key algorithm'));
            }
            if (pubKeys === undefined && passwords === undefined) {
                return reject(new Error('Missing key'));
            }
            if (sessionKey.length !== 32) {
                return reject(new Error('Invalid session key length'));
            }

            const options = {
                data: sessionKey,
                algorithm: algo
            };

            if (pubKeys && pubKeys.length) {
                const keys = getKeys(pubKeys);
                if (keys instanceof Error) return reject(keys);
                options.publicKeys = keys;
            }

            if (passwords) {
                if (!(passwords instanceof Array)) {
                    options.passwords = [passwords];
                } else {
                    options.passwords = passwords;
                }
            }
            openpgp.encryptSessionKey(options).then((result) => {
                resolve(result.message.packets.write());
            });
        });
    }

    // public keys optional, for verifying signature
    // returns an object { message, signature }
    function decryptMessage(encMessage, privKey, binary, sessionKeyAlgorithm, publicKeys) {
        return new Promise((resolve, reject) => {

            if (encMessage === undefined || encMessage === '') {
                return reject(new Error('Missing encrypted message'));
            }
            if (privKey === undefined || privKey === '') {
                return reject(new Error('Missing private key'));
            }
            let message;
            if ({}.isPrototypeOf.call(Uint8Array.prototype, encMessage)) {
                message = openpgp.message.read(encMessage);
            } else {
                message = openpgp.message.readArmored(encMessage.trim());
            }

            let privateKey = privKey;
            if (Array.isArray(privateKey)) {
                // Pick correct key
                if (privKey.length === 0) {
                    return reject(new Error('Empty key array'));
                }

                const encryptionKeyIds = message.getEncryptionKeyIds();
                if (!encryptionKeyIds.length) {
                    return reject(new Error('Nothing to decrypt'));
                }

                let privateKeyPacket = null;
                for (let i = 0; i < privateKey.length; i++) {
                    privateKeyPacket = privKey[i].getKeyPacket(encryptionKeyIds);
                    if (privateKeyPacket !== null) {
                        privateKey = privKey[i];
                        break;
                    }
                }
                if (privateKeyPacket == null) {
                    return reject(new Error('No appropriate private key found.'));
                }
            }

            const options = {
                message
            };

            if (publicKeys) {
                const keys = getKeys(publicKeys);
                if (keys instanceof Error) return reject(keys);
                options.publicKeys = keys;
            }

            if ({}.isPrototypeOf.call(Uint8Array.prototype, privateKey)) {
                options.sessionKey = { data: privateKey, algorithm: sessionKeyAlgorithm };
            } else if (typeof privateKey === 'string' || privateKey instanceof String) {
                options.password = privateKey;
            } else {
                options.privateKey = privateKey;
            }

            if (binary) {
                options.format = 'binary';
            }

            let sig;

            try {
                openpgp.decrypt(options).then((decrypted) => {
                    // for now, log signature info in console - later integrate with front end
                    if (binary) {
                        if (decrypted.signatures == null || decrypted.signatures[0] == null) {
                            console.log('No attachment signature present or no public keys provided');
                            sig = 0;
                        } else if (decrypted.signatures[0].valid) {
                            console.log('Verified attachment signature');
                            sig = 1;
                        } else {
                            console.log('Attachment signature could not be verified');
                            sig = 2;
                        }
                        resolve({ data: decrypted.data, filename: decrypted.filename, signature: sig });
                    } else {
                        if (decrypted.signatures == null || decrypted.signatures[0] == null) {
                            console.log('No message signature present or no public keys provided');
                            sig = 0;
                        } else if (decrypted.signatures[0].valid) {
                            console.log('Verified message signature');
                            sig = 1;
                        } else {
                            console.log('Message signature could not be verified');
                            sig = 2;
                        }
                        resolve({ data: decrypted.data, signature: sig });
                    }

                });
            } catch (err) {
                if (err.message === 'CFB decrypt: invalid key') {
                    return reject(err.message); // Bad password, reject without Error object
                }
                reject(err);
            }
        });
    }

    function decryptSessionKey(encMessage, key) {

        return new Promise((resolve, reject) => {
            if (encMessage === undefined || encMessage === '') {
                return reject(new Error('Missing encrypted message'));
            }
            if (key === undefined || key === '') {
                return reject(new Error('Missing password'));
            }

            let message;
            if ({}.isPrototypeOf.call(Uint8Array.prototype, encMessage)) {
                message = openpgp.message.read(encMessage);
            } else {
                message = openpgp.message.readArmored(encMessage.trim());
            }

            let privateKey = key;
            if (Array.isArray(privateKey)) {
                // Pick correct key
                if (key.length === 0) {
                    reject(new Error('Empty key array'));
                }

                const encryptionKeyIds = message.getEncryptionKeyIds();
                if (!encryptionKeyIds.length) {
                    reject(new Error('Nothing to decrypt'));
                }
                let privateKeyPacket = null;
                for (let i = 0; i < privateKey.length; i++) {
                    privateKeyPacket = privateKey[i].getKeyPacket(encryptionKeyIds);
                    if (privateKeyPacket !== null) {
                        privateKey = privateKey[i];
                        break;
                    }
                }
                if (privateKeyPacket == null) {
                    reject(new Error('No appropriate private key found.'));
                }
            }

            const options = {
                message
            };

            if (typeof privateKey === 'string' || privateKey instanceof String) {
                options.password = privateKey;
            } else {
                options.privateKey = privateKey;
            }

            try {
                openpgp.decryptSessionKey(options).then((result) => {
                    const data = result.data;
                    if (data === undefined) {
                        // unencrypted attachment?
                        return reject(new Error('Undefined session key'));
                    } else if (data.length !== 32) {
                        return reject(new Error('Invalid session key length'));
                    }
                    resolve({ key: data, algo: result.algorithm });
                });
            } catch (err) {
                if (err.message === 'CFB decrypt: invalid key') {
                    return reject(err.message); // Bad password, reject without Error object
                }
                reject(err);
            }
        });
    }

    function encryptPrivateKey(privKey, privKeyPassCode) {

        return new Promise((resolve, reject) => {

            if (Object.prototype.toString.call(privKeyPassCode) !== '[object String]' || privKeyPassCode === '') {
                return reject(new Error('Missing private key passcode'));
            }

            if (!{}.isPrototypeOf.call(openpgp.key.Key.prototype, privKey)) {
                return reject(new Error('Not a Key object'));
            }

            if (!privKey.isPrivate()) {
                return reject(new Error('Not a private key'));
            }

            if (privKey.primaryKey === null || privKey.subKeys === null || privKey.subKeys.length === 0) {
                return reject(new Error('Missing primary key or subkey'));
            }

            privKey.primaryKey.encrypt(privKeyPassCode);
            privKey.subKeys[0].subKey.encrypt(privKeyPassCode);
            resolve(privKey.armor());
        });
    }

    function decryptPrivateKey(privKey, privKeyPassCode) {

        return new Promise((resolve, reject) => {
            if (privKey === undefined || privKey === '') {
                return reject(new Error('Missing private key'));
            }
            if (privKeyPassCode === undefined || privKeyPassCode === '') {
                return reject(new Error('Missing private key passcode'));
            }

            const keys = getKeys(privKey);
            if (keys instanceof Error) return reject(keys);

            if (keys[0].decrypt(privKeyPassCode)) {
                resolve(keys[0]);
            } else reject('Private key decryption failed'); // Do NOT make this an Error object
        });
    }

    function getHashedPassword(password) {
        return btoa(arrayToBinaryString(window.openpgp.crypto.hash.sha512(binaryStringToArray(password))));
    }

    function splitFile(msg) {

        return new Promise((resolve, reject) => {

            const keyFilter = (packet) => {
                return packet.tag !== openpgp.enums.packet.symmetricallyEncrypted && packet.tag !== openpgp.enums.packet.symEncryptedIntegrityProtected;
            };

            const nonData = msg.packets.filter(keyFilter);
            const data = msg.packets.filterByTag(openpgp.enums.packet.symmetricallyEncrypted, openpgp.enums.packet.symEncryptedIntegrityProtected);

            if (nonData.length === 0) {
                return reject(new Error('No non-data packets found'));
            }
            if (data.length === 0) {
                return reject(new Error('No data packets found'));
            }

            const obj = {
                keys: nonData.write(),
                data: data.write()
            };
            resolve(obj);
        });
    }

    function keyInfo(privKey) {

        return new Promise((resolve, reject) => {

            const keys = getKeys(privKey);
            if (keys instanceof Error) return reject(keys);

            const obj = {
                publicKeyArmored: keys[0].toPublic().armor(),
                fingerprint: keys[0].primaryKey.getFingerprint(),
                userIds: keys[0].getUserIds(),
                bitSize: keys[0].primaryKey.getBitSize(),
                created: keys[0].primaryKey.created
            };

            encryptMessage('test message', privKey).then(
                () => {
                    resolve(obj);
                },
                (err) => {
                    reject(err);
                }
            );
        });
    }

    function binaryStringToArray(str) {
        const bytes = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) {
            bytes[i] = str.charCodeAt(i);
        }
        return bytes;
    }

    function arrayToBinaryString(arr) {
        const result = [];
        for (let i = 0; i < arr.length; i++) {
            result[i] = String.fromCharCode(arr[i]);
        }
        return result.join('');
    }

    return {
        // returns promise for generated RSA public and encrypted private keys
        generateKeysRSA,

        // returns a promise, reject with Error
        encryptMessage,
        decryptMessage,
        decryptMessageRSA, // Backwards compatibility wrapper

        // AES session key generation
        generateKeyAES,

        // Get keys
        getKeys,

        // Encrypted attachments syntactic sugar
        encryptFile,

        // Private key
        encryptPrivateKey,
        decryptPrivateKey,

        // Session key manipulation
        encryptSessionKey,
        decryptSessionKey,

        // Login page
        getHashedPassword,

        // Javascript string to/from base64-encoded and/or UTF8
        encode_utf8,
        decode_utf8,
        encode_base64,
        decode_base64,
        encode_utf8_base64,
        decode_utf8_base64,

        // Typed array/binary string conversions
        arrayToBinaryString,
        binaryStringToArray,
        concatArrays: openpgp.util.concatUint8Array,

        // Split existing encrypted file into data and non-data parts
        splitFile,

        // Dump key information
        keyInfo
    };
}());

// node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = pmcrypto;
}
