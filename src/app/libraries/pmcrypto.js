/*
 * Be VERY careful about changing this file. It is used in both the browser JS package and in the node.js encryption server
 * Just because your changes work in the browser does not mean they work in the encryption server!
 */

if (typeof module !== 'undefined' && module.exports) {
    // node.js
    btoa = require('btoa');
    atob = require('atob');
    /* jshint ignore:start */
    Promise = require('es6-promise').Promise;
    /* jshint ignore:end */
    openpgp = require('./openpgp.min.js');
    openpgp.config.integrity_protect = true;
    openpgp.config.useNative = true;
}
else {
    // Browser
    // Default is true, but just to make sure
    openpgp.config.useWebCrypto = true;
    openpgp.config.integrity_protect = true;
    // Falls back to Web Worker if WebCrypto not available or above set to false
    openpgp.initWorker('openpgp.worker.min.js');
}

var pmcrypto = (function() {

    // Deprecated, backwards compatibility
    var protonmail_crypto_headerMessage = "---BEGIN ENCRYPTED MESSAGE---";
    var protonmail_crypto_tailMessage = "---END ENCRYPTED MESSAGE---";
    var protonmail_crypto_headerRandomKey = "---BEGIN ENCRYPTED RANDOM KEY---";
    var protonmail_crypto_tailRandomKey = "---END ENCRYPTED RANDOM KEY---";

    function generateEmailPM(encMessage, encRandomKey) {
        var EmailPM = protonmail_crypto_headerMessage + encMessage + protonmail_crypto_tailMessage;
        EmailPM += "||" + protonmail_crypto_headerRandomKey + encRandomKey + protonmail_crypto_tailRandomKey;
        return EmailPM;
    }

    function getEncMessageFromEmailPM(EmailPM) {
        if (EmailPM !== undefined && typeof EmailPM.search === "function") {
            var begin = EmailPM.search(protonmail_crypto_headerMessage) + protonmail_crypto_headerMessage.length;
            var end = EmailPM.search(protonmail_crypto_tailMessage);
            if (begin === -1 || end === -1) return '';
            return EmailPM.substring(begin, end);
        }
        return '';
    }

    function getEncRandomKeyFromEmailPM(EmailPM) {
        if (EmailPM !== undefined && typeof EmailPM.search === "function") {
            var begin = EmailPM.search(protonmail_crypto_headerRandomKey) + protonmail_crypto_headerRandomKey.length;
            var end = EmailPM.search(protonmail_crypto_tailRandomKey);
            if (begin === -1 || end === -1) return '';
            return EmailPM.substring(begin, end);
        }
        return '';
    }

    // Backwards-compatible decrypt RSA message function
    function decryptMessageRSA(encMessage, prKey, messageTime) {

        return new Promise(function(resolve, reject) {

            if (encMessage === undefined || encMessage === '') {
                return reject(new Error('Missing encrypted message'));
            }
            if (prKey === undefined || prKey === '') {
                return reject(new Error('Missing private key'));
            }
            if (messageTime === undefined || messageTime === '') {
                return reject(new Error('Missing message time'));
            }

            var oldEncMessage = getEncMessageFromEmailPM(encMessage);
            var oldEncRandomKey = getEncRandomKeyFromEmailPM(encMessage);

            // OpenPGP
            if (oldEncMessage === '' || oldEncRandomKey === '') return resolve(decryptMessage(encMessage, prKey));

            // Old message encryption format
            resolve(decryptMessage(oldEncRandomKey, prKey)
                .then(decode_utf8_base64)
                .then(function(randomKey) {

                    if (randomKey === '') {
                        return Promise.reject(new Error('Random key is empty'));
                    }

                    oldEncMessage = pmcrypto.decode_utf8_base64(oldEncMessage);

                    var decryptedMessage;
                    try {
                        randomKey = pmcrypto.binaryStringToArray(randomKey);
                        oldEncMessage = pmcrypto.binaryStringToArray(oldEncMessage);
                        // cutoff time for enabling multilanguage support
                        if (messageTime > 1399086120) // parseInt($('#messageTime').val())
                            decryptedMessage = decode_utf8_base64(pmcrypto.arrayToBinaryString(openpgp.crypto.cfb.decrypt("aes256", randomKey, oldEncMessage, true)));
                        else
                            decryptedMessage = pmcrypto.arrayToBinaryString(openpgp.crypto.cfb.decrypt("aes256", randomKey, oldEncMessage, true));
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
        if (data !== undefined) return decode_utf8(decode_base64(data));
    }

    function generateKeysRSA(user, password, numBits) {

        numBits = (typeof numBits !== 'undefined') ? numBits : 2048;

        if (password.length === 0) {
            return Promise.reject('Missing private key passcode');
        }

        return openpgp.generateKeyPair({
            numBits: numBits,
            userId: user,
            passphrase: password
        });
    }

    function generateKeyAES() {
        return openpgp.crypto.generateSessionKey("aes256");
    }

    function getKeys(keys) {
        var _keys;
        try {
            _keys = openpgp.key.readArmored(keys);
        } catch (err) {
            return err;
        }

        if (_keys === undefined) {
            return new Error('Cannot parse key(s)');
        }
        if (_keys.err) {
            // openpgp.key.readArmored returns error arrays.
            return new Error(_keys.err[0].message);
        }
        if (_keys.keys.length < 1 || _keys.keys[0] === undefined) {
            return new Error('Invalid key(s)');
        }

        return _keys.keys;
    }

    function encryptMessage(message, pubKeys, passwords, params) {

        return new Promise(function(resolve, reject) {
            if (message === undefined) {
                return reject(new Error('Missing data'));
            }
            if (pubKeys === undefined && passwords === undefined) {
                return reject(new Error('Missing key'));
            }

            var keys;
            if (pubKeys && pubKeys.length) {
                keys = getKeys(pubKeys);
                if (keys instanceof Error) return reject(keys);
            }

            resolve(openpgp.encryptMessage(keys, message, passwords, params));
        });
    }

    function encryptFile(data, pubKeys, passwords, filename) {

        var params = {
            packets: true,
            filename: filename
        };

        return encryptMessage(data, pubKeys, passwords, params);
    }

    function encryptSessionKey(sessionKey, algo, pubKeys, passwords) {

        // console.log(pubKeys, passwords);

        return new Promise(function(resolve, reject) {
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

            var keys;
            if (pubKeys && pubKeys.length) {
                keys = getKeys(pubKeys);
                if (keys instanceof Error) return reject(keys);
            }

            resolve(openpgp.encryptSessionKey(sessionKey, algo, keys, passwords));
        });
    }

    function decryptMessage(encMessage, key, binary, sessionKeyAlgorithm) {

        return new Promise(function(resolve, reject) {
            if (encMessage === undefined || encMessage === '') {
                return reject(new Error('Missing encrypted message'));
            }
            if (key === undefined || key === '') {
                return reject(new Error('Missing key'));
            }

            var _encMessage;
            if (Uint8Array.prototype.isPrototypeOf(encMessage)) {
                _encMessage = openpgp.message.read(encMessage);
            } else {
                _encMessage = openpgp.message.readArmored(encMessage.trim());
            }

            if ( Array.isArray( key ) ) {
                // Pick correct key
                if ( key.length  == 0 ) {
                    return reject(new Error('Empty key array'));
                }

                var encryptionKeyIds = _encMessage.getEncryptionKeyIds();
                if (!encryptionKeyIds.length) {
                    return reject(new Error('Nothing to decrypt'));
                }
                var privateKeyPacket = null;
                for( var i = 0; i<key.length; i++ ) {
                    privateKeyPacket = key[i].getKeyPacket(encryptionKeyIds);
                    if ( privateKeyPacket !== null ) {
                        key = key[i];
                        break;
                    }
                }
                if ( privateKeyPacket == null ) {
                    return reject(new Error('No appropriate private key found.'));
                }
            }

            var params = {
                binary: binary,
                sessionKeyAlgorithm: sessionKeyAlgorithm
            };

            try {
                resolve(openpgp.decryptMessage(key, _encMessage, params));
            } catch (err) {
                if (err.message == 'CFB decrypt: invalid key') {
                    return reject(err.message); //Bad password, reject without Error object
                }
                reject(err);
            }
        });
    }

    function decryptSessionKey(encMessage, key) {

        return new Promise(function(resolve, reject) {
            if (encMessage === undefined || encMessage === '') {
                return reject(new Error('Missing encrypted message'));
            }
            if (key === undefined || key === '') {
                return reject(new Error('Missing password'));
            }

            var _encMessage;
            if (Uint8Array.prototype.isPrototypeOf(encMessage)) {
                _encMessage = openpgp.message.read(encMessage);
            } else {
                _encMessage = openpgp.message.readArmored(encMessage.trim());
            }

            if ( Array.isArray( key ) ) {
                // Pick correct key
                if ( key.length  == 0 ) {
                    reject(new Error('Empty key array'));
                }

                var encryptionKeyIds = _encMessage.getEncryptionKeyIds();
                if (!encryptionKeyIds.length) {
                    reject(new Error('Nothing to decrypt'));
                }
                var privateKeyPacket = null;
                for( var i = 0; i<key.length; i++ ) {
                    privateKeyPacket = key[i].getKeyPacket(encryptionKeyIds);
                    if ( privateKeyPacket !== null ) {
                        key = key[i];
                        break;
                    }
                }
                if ( privateKeyPacket == null ) {
                    reject(new Error('No appropriate private key found.'));
                }
            }

            try {
                resolve(openpgp.decryptSessionKey(key, _encMessage).then(function(data) {
                    if (data.key===undefined) {
                        // unencrypted attachment?
                        throw new Error('Undefined session key');
                    }
                    else if (data.key.length !== 32) {
                        throw new Error('Invalid session key length');
                    } else {
                        return data;
                    }
                }));
            } catch (err) {
                if (err.message == 'CFB decrypt: invalid key') {
                    return reject(err.message); //Bad password, reject without Error object
                }
                reject(err);
            }
        });
    }

    function encryptPrivateKey(prKey, prKeyPassCode) {

        return new Promise(function(resolve, reject) {

            if ( Object.prototype.toString.call(prKeyPassCode) != '[object String]' || prKeyPassCode === '' ) {
                return reject(new Error('Missing private key passcode'));
            }

            if( !openpgp.key.Key.prototype.isPrototypeOf(prKey) ) {
                return reject(new Error('Not a Key object'));
            }

            if( !prKey.isPrivate() ) {
                return reject(new Error('Not a private key'));
            }

            if( prKey.primaryKey === null || prKey.subKeys === null || prKey.subKeys.length === 0 ) {
                return reject(new Error('Missing primary key or subkey'));
            }

            prKey.primaryKey.encrypt(prKeyPassCode);
            prKey.subKeys[0].subKey.encrypt(prKeyPassCode);
            resolve(prKey.armor());
        });
    }

    function decryptPrivateKey(prKey, prKeyPassCode) {

        return new Promise(function(resolve, reject) {
            if (prKey === undefined || prKey === '') {
                return reject(new Error('Missing private key'));
            }
            if (prKeyPassCode === undefined || prKeyPassCode === '') {
                return reject(new Error('Missing private key passcode'));
            }

            var keys = getKeys(prKey);
            if (keys instanceof Error) return reject(keys);

            if (keys[0].decrypt(prKeyPassCode)) {
                resolve(keys[0]);
            } else reject('Private key decryption failed'); // Do NOT make this an Error object
        });
    }

    function getHashedPassword(password) {
        var hashed = arrayToBinaryString(window.openpgp.crypto.hash.sha512(binaryStringToArray(password)));
        hashed = btoa(hashed);
        return hashed;
    }

    function splitFile( encMessage ) {

        return new Promise(function(resolve, reject) {

            var msg;
            if (Uint8Array.prototype.isPrototypeOf(encMessage)) {
                msg = openpgp.message.read(encMessage);
            } else {
                msg = openpgp.message.readArmored(encMessage.trim());
            }

            var keyFilter = function(packet) {
                return packet.tag != openpgp.enums.packet.symmetricallyEncrypted && packet.tag != openpgp.enums.packet.symEncryptedIntegrityProtected;
            };

            var nonData = msg.packets.filter(keyFilter);
            var data = msg.packets.filterByTag(openpgp.enums.packet.symmetricallyEncrypted, openpgp.enums.packet.symEncryptedIntegrityProtected);

            if ( nonData.length === 0 ) {
                return reject(new Error('No non-data packets found'));
            }
            if ( data.length === 0 ) {
                return reject(new Error('No data packets found'));
            }

            var obj = {
                keys: nonData.write(),
                data: data.write()
            };
            resolve(obj);
        });
    }

    function keyInfo( prKey ) {

        return new Promise(function(resolve, reject) {

            var keys = getKeys(prKey);
            if (keys instanceof Error) return reject(keys);

            var obj = {
                publicKeyArmored: keys[0].toPublic().armor(),
                fingerprint: keys[0].primaryKey.getFingerprint(),
                userIds: keys[0].getUserIds(),
                bitSize: keys[0].primaryKey.getBitSize(),
                created: keys[0].primaryKey.created
            };

            encryptMessage("test message", prKey).then(
                function() {
                    resolve(obj);
                },
                function(err) {
                    reject(err);
                }
            );
        }.bind(this));
    }

    function binaryStringToArray(str) {
        var bytes = new Uint8Array(str.length);
        for (var i = 0; i < str.length; i++) {
            bytes[i] = str.charCodeAt(i);
        }
        return bytes;
    }

    function arrayToBinaryString(arr) {
        var result = [];
        for (var i = 0; i < arr.length; i++) {
            result[i] = String.fromCharCode(arr[i]);
        }
        return result.join('');
    }

    var obj = {
        // returns promise for generated RSA public and encrypted private keys
        generateKeysRSA: generateKeysRSA,

        // returns a promise, reject with Error
        encryptMessage: encryptMessage,
        decryptMessage: decryptMessage,
        decryptMessageRSA: decryptMessageRSA, // Backwards compatibility wrapper

        // AES session key generation
        generateKeyAES: generateKeyAES,

        // Encrypted attachments syntactic sugar
        encryptFile: encryptFile,

        // Private key
        encryptPrivateKey: encryptPrivateKey,
        decryptPrivateKey: decryptPrivateKey,

        // Session key manipulation
        encryptSessionKey: encryptSessionKey,
        decryptSessionKey: decryptSessionKey,

        // Login page
        getHashedPassword: getHashedPassword,

        // Javascript string to/from base64-encoded and/or UTF8
        encode_utf8: encode_utf8,
        decode_utf8: decode_utf8,
        encode_base64: encode_base64,
        decode_base64: decode_base64,
        encode_utf8_base64: encode_utf8_base64,
        decode_utf8_base64: decode_utf8_base64,

        //Typed array/binary string conversions
        arrayToBinaryString: arrayToBinaryString,
        binaryStringToArray: binaryStringToArray,
        concatArrays: openpgp.util.concatUint8Array,

        // Split existing encrypted file into data and non-data parts
        splitFile: splitFile,

        // Dump key information
        keyInfo: keyInfo
    };

    return obj;
}());

//node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = pmcrypto;
}
