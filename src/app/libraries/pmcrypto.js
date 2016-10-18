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
    openpgp.config.use_native = true;
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
    function decryptMessageRSA(encMessage, privKey, messageTime, pubKeys) {
        return new Promise(function(resolve, reject) {

            if (encMessage === undefined || encMessage === '') {
                return reject(new Error('Missing encrypted message'));
            }
            if (privKey === undefined || privKey === '') {
                return reject(new Error('Missing private key'));
            }
            if (messageTime === undefined || messageTime === '') {
                return reject(new Error('Missing message time'));
            }

            var oldEncMessage = getEncMessageFromEmailPM(encMessage);
            var oldEncRandomKey = getEncRandomKeyFromEmailPM(encMessage);

            // OpenPGP
            if (oldEncMessage === '' || oldEncRandomKey === '') return resolve(decryptMessage(encMessage, privKey, false, null, pubKeys));

            // Old message encryption format
            resolve(decryptMessage(oldEncRandomKey, privKey, false)
                .then(decode_utf8_base64)
                .then(function(randomKey) {

                    if (randomKey === '') {
                        return Promise.reject(new Error('Random key is empty'));
                    }

                    oldEncMessage = pmcrypto.decode_utf8_base64({message:oldEncMessage});

                    var decryptedMessage;
                    try {
                        randomKey = pmcrypto.binaryStringToArray(randomKey);
                        oldEncMessage = pmcrypto.binaryStringToArray(oldEncMessage);
                        // cutoff time for enabling multilanguage support
                        if (messageTime > 1399086120)
                            decryptedMessage = decode_utf8_base64({message:pmcrypto.arrayToBinaryString(openpgp.crypto.cfb.decrypt("aes256", randomKey, oldEncMessage, true))});
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
        if (data !== undefined) {
            if (data.message !== undefined) {
                return decode_utf8(decode_base64(data.message));
            }
            else {
                return decode_utf8(decode_base64(data));   
            }
        }
    }

    function generateKeysRSA(user, password, numBits) {

        numBits = (typeof numBits !== 'undefined') ? numBits : 2048;

        if (password.length === 0) {
            return Promise.reject('Missing private key passcode');
        }

        var user = {
            name: user,
            email: user
        };
        var keys = openpgp.generateKey({
            numBits: numBits,
            userIds: [user],
            passphrase: password
        });
        return keys;
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

    //privKeys is optional - will also sign the message
    function encryptMessage(message, pubKeys, passwords, privKeys) {
        return new Promise(function(resolve, reject) {
            if (message === undefined) {
                return reject(new Error('Missing data'));
            }
            if (pubKeys === undefined && passwords === undefined) {
                return reject(new Error('Missing key'));
            }

            var options = {
                data: message,
                armor: true
            };

            if (pubKeys && pubKeys.length) {
                keys = getKeys(pubKeys);
                if (keys instanceof Error) return reject(keys);
                options.publicKeys = keys;
            }
            if (passwords){
                if (!passwords instanceof Array){
                    passwords = [passwords];
                }
                options.passwords = passwords;
            }
            if (privKeys){
                options.privateKeys = privKeys[0];
            }

            openpgp.encrypt(options).then(function(ciphertext){
                resolve(ciphertext.data);
            });

        });
    }

    //when attachment signing is implemented, use the privKeys parameter
    function encryptFile(data, pubKeys, passwords, filename, privKeys) {
        return new Promise(function(resolve, reject){
            if (data === undefined) {
                return reject(new Error('Missing data'));
            }
            if (pubKeys === undefined && passwords === undefined) {
                return reject(new Error('Missing key'));
            }

            var keys;

            var options = {
                filename: filename,
                data: data,
                armor: false
            };
            if (pubKeys && pubKeys.length) {
                keys = getKeys(pubKeys);
                if (keys instanceof Error) return reject(keys);
                options.publicKeys = keys;
            }
            if (passwords){
                if (!passwords instanceof Array){
                    passwords = [passwords];
                }
                options.passwords = passwords
            }

            if (privKeys){
                options.privateKeys = privKeys[0];
            }

            openpgp.encrypt(options).then(function(ciphertext){
                resolve(splitFile(ciphertext.message));

            });

        });

    }

    function encryptSessionKey(sessionKey, algo, pubKeys, passwords) {

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

            var options = {
                data: sessionKey,
                algorithm: algo,
            };

            if (pubKeys && pubKeys.length) {
                keys = getKeys(pubKeys);
                if (keys instanceof Error) return reject(keys);
                options.publicKeys = keys;
            }
            if (passwords){
                if (!passwords instanceof Array){
                    passwords = [passwords];
                }
                options.passwords = passwords
            }
            openpgp.encryptSessionKey(options).then(function(result){
                resolve(result.message.packets.write());
            });
        });
    }

    //public keys optional, for verifying signature
    // returns an object { message, signature }
    function decryptMessage(encMessage, privKey, binary, sessionKeyAlgorithm, publicKeys) {
        return new Promise(function(resolve, reject) {
            if (encMessage === undefined || encMessage === '') {
                return reject(new Error('Missing encrypted message'));
            }
            if (privKey === undefined || privKey === '') {
                return reject(new Error('Missing private key'));
            }
            var _encMessage;
            if (Uint8Array.prototype.isPrototypeOf(encMessage)) {
                _encMessage = openpgp.message.read(encMessage);
            } else {
                _encMessage = openpgp.message.readArmored(encMessage.trim());
            }

            if ( Array.isArray(privKey) ) {
                // Pick correct key
                if ( key.length  == 0 ) {
                    return reject(new Error('Empty key array'));
                }

                var encryptionKeyIds = _encMessage.getEncryptionKeyIds();
                if (!encryptionKeyIds.length) {
                    return reject(new Error('Nothing to decrypt'));
                }
                var privateKeyPacket = null;
                for( var i = 0; i<privKey.length; i++ ) {
                    privateKeyPacket = privKey[i].getKeyPacket(encryptionKeyIds);
                    if ( privateKeyPacket !== null ) {
                        privKey = privKey[i];
                        isKey = true;
                        break;
                    }
                }
                if ( privateKeyPacket == null ) {
                    return reject(new Error('No appropriate private key found.'));
                }
            }
            var options = {
                message: _encMessage,
            }

            if (publicKeys){
                publicKeys = getKeys(publicKeys);
                if (publicKeys instanceof Error) return reject(publicKeys);
                options.publicKeys = publicKeys;
            }


           if (Uint8Array.prototype.isPrototypeOf(privKey)) {
                options.sessionKey = {data: privKey, algorithm: sessionKeyAlgorithm};
            } else if (typeof privKey === 'string' || privKey instanceof String){
                options.password = privKey;
            } else {
                options.privateKey = privKey;
            }

            if (binary){
                options.format = 'binary';
            }

            var sig;


            try {
                openpgp.decrypt(options).then(function(decrypted){
                    //for now, log signature info in console - later integrate with front end
                    if (binary){
                        if (decrypted.signatures == null || decrypted.signatures[0] == null){
                            console.log("No attachment signature present");
                            sig = 0;
                        } else if (decrypted.signatures[0].valid == true){
                            console.log("Verified attachment signature");
                            sig = 1;
                        } else {
                            console.log("Attachment signature could not be verified");
                            sig = 2;
                        }
                        resolve({ data: decrypted.data, filename: decrypted.filename, signature: sig });
                    } else {
                        if (decrypted.signatures == null || decrypted.signatures[0] == null){
                            console.log("No message signature present");
                            sig = 0;
                        } else if (decrypted.signatures[0].valid == true){
                            console.log("Verified message signature");
                            sig = 1;
                        } else {
                            console.log("Message signature could not be verified");
                            sig = 2;
                        }
                        resolve({ data:decrypted.data, signature: sig});
                    }

                 });
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
                var options = {
                    message: _encMessage,
                };

                if (typeof key === 'string' || key instanceof String){
                    options.password = key;
                } else {
                    options.privateKey = key;
                }

                openpgp.decryptSessionKey(options).then(function(result) {
                    var key = result.data
                    if (key===undefined) {
                        // unencrypted attachment?
                        throw new Error('Undefined session key');
                    } else if (key.length !== 32) {
                        throw new Error('Invalid session key length');
                    } else {
                        resolve({key: key, algo: result.algorithm});
                    }
                });
            } catch (err) {
                if (err.message == 'CFB decrypt: invalid key') {
                    return reject(err.message); //Bad password, reject without Error object
                }
                reject(err);
            }
        });
    }

    function encryptPrivateKey(privKey, privKeyPassCode) {

        return new Promise(function(resolve, reject) {

            if ( Object.prototype.toString.call(prKeyPassCode) != '[object String]' || prKeyPassCode === '' ) {
                return reject(new Error('Missing private key passcode'));
            }

            if( !openpgp.key.Key.prototype.isPrototypeOf(privKey) ) {
                return reject(new Error('Not a Key object'));
            }

            if( !privKey.isPrivate() ) {
                return reject(new Error('Not a private key'));
            }

            if( prKey.primaryKey === null || prKey.subKeys === null || prKey.subKeys.length === 0 ) {
                return reject(new Error('Missing primary key or subkey'));
            }

            privKey.primaryKey.encrypt(privKeyPassCode);
            privKey.subKeys[0].subKey.encrypt(privKeyPassCode);
            resolve(privKey.armor());
        });
    }

    function decryptPrivateKey(privKey, privKeyPassCode) {

        return new Promise(function(resolve, reject) {
            if (privKey === undefined || privKey === '') {
                return reject(new Error('Missing private key'));
            }
            if (privKeyPassCode === undefined || privKeyPassCode === '') {
                return reject(new Error('Missing private key passcode'));
            }

            var keys = getKeys(privKey);
            if (keys instanceof Error) return reject(keys);

            if (keys[0].decrypt(privKeyPassCode)) {
                resolve(keys[0]);
            } else reject('Private key decryption failed'); // Do NOT make this an Error object
        });
    }

    function getHashedPassword(password) {
        var hashed = arrayToBinaryString(window.openpgp.crypto.hash.sha512(binaryStringToArray(password)));
        hashed = btoa(hashed);
        return hashed;
    }

    function signMessage(plaintext){
        var options = {}

    }


    function splitFile(msg) {

        return new Promise(function(resolve, reject) {

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

    function keyInfo( privKey ) {

        return new Promise(function(resolve, reject) {

            var keys = getKeys(privKey);
            if (keys instanceof Error) return reject(keys);

            var obj = {
                publicKeyArmored: keys[0].toPublic().armor(),
                fingerprint: keys[0].primaryKey.getFingerprint(),
                userIds: keys[0].getUserIds(),
                bitSize: keys[0].primaryKey.getBitSize(),
                created: keys[0].primaryKey.created
            };

            encryptMessage("test message", privKey).then(
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

        // Get keys
        getKeys: getKeys,

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
