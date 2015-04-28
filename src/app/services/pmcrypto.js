angular.module("proton.pmcrypto", [])

.provider("pmcrypto", function pmcryptoProvider() {
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
        if (EmailPM!==undefined&&typeof EmailPM.search === "function") {
            var begin = EmailPM.search(protonmail_crypto_headerMessage) + protonmail_crypto_headerMessage.length;
            var end = EmailPM.search(protonmail_crypto_tailMessage);
            if(begin === -1 || end === -1) return '';
            return EmailPM.substring(begin, end);
        }
        return '';
    }

    function getEncRandomKeyFromEmailPM(EmailPM) {
        if (EmailPM!==undefined&&typeof EmailPM.search === "function") {
            var begin = EmailPM.search(protonmail_crypto_headerRandomKey) + protonmail_crypto_headerRandomKey.length;
            var end = EmailPM.search(protonmail_crypto_tailRandomKey);
            if(begin === -1 || end === -1) return '';
            return EmailPM.substring(begin, end);
        }
        return '';
    }

    // Backwards-compatible decrypt RSA message function
    function decryptMessageRSA(encMessage, prKey, messageTime) {

        return new Promise(function (resolve, reject) {

            if(encMessage === undefined || encMessage === '') {
                return reject(new Error('Missing encrypted message'));
            }
            if(prKey === undefined || prKey === '') {
                return reject(new Error('Missing private key'));
            }
            if(messageTime === undefined || messageTime === '') {
                return reject(new Error('Missing message time'));
            }

            var oldEncMessage = getEncMessageFromEmailPM(encMessage);
            var oldEncRandomKey = getEncRandomKeyFromEmailPM(encMessage);

            // OpenPGP
            if(oldEncMessage==='' || oldEncRandomKey==='') return resolve(decryptMessage(encMessage, prKey));

            // Old message encryption format
            resolve(decryptMessage(oldEncRandomKey, prKey)
                .then(decode_utf8_base64)
                .then(function(randomKey) {

                    if (randomKey==='') {
                        return Promise.reject(new Error('Random key is empty'));
                    }

                    oldEncMessage = pmcrypto.decode_utf8_base64(oldEncMessage);

                    var decryptedMessage;
                    try {
                        randomKey = pmcrypto.binaryStringToArray(randomKey);
                        oldEncMessage = pmcrypto.binaryStringToArray(oldEncMessage);
                        // cutoff time for enabling multilanguage support
                        if (messageTime>1399086120) // parseInt($('#messageTime').val())
                            decryptedMessage = decode_utf8_base64(pmcrypto.arrayToBinaryString(openpgp.crypto.cfb.decrypt("aes256",randomKey,oldEncMessage,true)));
                        else
                            decryptedMessage = pmcrypto.arrayToBinaryString(openpgp.crypto.cfb.decrypt("aes256",randomKey,oldEncMessage,true));
                    }
                    catch(err) {
                        return Promise.reject(err);
                    }
                    return decryptedMessage;
                }));
        });
    }

    // Current
    function encode_utf8(data) { if (data!==undefined) return unescape(encodeURIComponent(data)); }
    function decode_utf8(data) { if (data!==undefined) return decodeURIComponent(escape(data)); }
    function encode_base64(data) { if (data!==undefined) return btoa(data).trim(); }
    function decode_base64(data) { if (data!==undefined) return atob(data.trim()); }
    function encode_utf8_base64(data) { if (data!==undefined) return encode_base64(encode_utf8(data)); }
    function decode_utf8_base64(data) { if (data!==undefined) return decode_utf8(decode_base64(data)); }

    function generateKeysRSA(user, password) {
        return openpgp.generateKeyPair({numBits: 2048, userId: user, passphrase: password});
    }

    function generateKeyAES() {
        return openpgp.crypto.generateSessionKey("aes256");
    }

    function getKeys(keys) {
        var _keys;
        try {
            _keys = openpgp.key.readArmored(keys);
        }
        catch(err) {
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

        return new Promise(function (resolve, reject) {
            if(message === undefined) {
                return reject(new Error('Missing data'));
            }
            if(pubKeys === undefined && passwords === undefined) {
                return reject(new Error('Missing key'));
            }

            var keys;
            if(pubKeys && pubKeys.length) {
                keys = getKeys(pubKeys);
                if(keys instanceof Error) return reject(keys);
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

        return new Promise(function (resolve, reject) {
            if(sessionKey === undefined) {
                return reject(new Error('Missing session key'));
            }
            if(algo === undefined) {
                return reject(new Error('Missing session key algorithm'));
            }
            if(pubKeys === undefined && passwords === undefined) {
                return reject(new Error('Missing key'));
            }

            var keys;
            if(pubKeys && pubKeys.length) {
                keys = getKeys(pubKeys);
                if(keys instanceof Error) return reject(keys);
            }

            resolve(openpgp.encryptSessionKey(sessionKey, algo, keys, passwords));
        });
    }

    function decryptMessage(encMessage, key, binary, sessionKeyAlgorithm) {

        return new Promise(function (resolve, reject) {
            if(encMessage === undefined || encMessage === '') {
                return reject(new Error('Missing encrypted message'));
            }
            if(key === undefined  || key === '') {
                return reject(new Error('Missing key'));
            }

            var _encMessage;
            if(Uint8Array.prototype.isPrototypeOf(encMessage)) {
                _encMessage = openpgp.message.read(encMessage);
            }
            else {
                _encMessage = openpgp.message.readArmored(encMessage.trim());
            }

            var params = {
                binary: binary,
                sessionKeyAlgorithm: sessionKeyAlgorithm
            };

            try {
                resolve(openpgp.decryptMessage(key, _encMessage, params));
            }
            catch(err) {
                if(err.message == 'CFB decrypt: invalid key') {
                    return reject(err.message); //Bad password, reject without Error object
                }
                reject(err);
            }
        });
    }

    function decryptSessionKey(encMessage, key) {

        return new Promise(function (resolve, reject) {
            if(encMessage === undefined || encMessage === '') {
                return reject(new Error('Missing encrypted message'));
            }
            if(key === undefined  || key === '') {
                return reject(new Error('Missing password'));
            }

            var _encMessage;
            if(Uint8Array.prototype.isPrototypeOf(encMessage)) {
                _encMessage = openpgp.message.read(encMessage);
            }
            else {
                _encMessage = openpgp.message.readArmored(encMessage.trim());
            }

            try {
                resolve(openpgp.decryptSessionKey(key, _encMessage));
            }
            catch(err) {
                if(err.message == 'CFB decrypt: invalid key') {
                    return reject(err.message); //Bad password, reject without Error object
                }
                reject(err);
            }
        });
    }

    function decryptPrivateKey(prKey, prKeyPassCode) {

        return new Promise(function (resolve, reject) {
            if(prKey === undefined  || prKey === '') {
                return reject(new Error('Missing private key'));
            }
            if(prKeyPassCode === undefined || prKeyPassCode === '') {
                return reject(new Error('Missing private key passcode'));
            }

            keys = getKeys(prKey);
            if(keys instanceof Error) return reject(keys);

            if(keys[0].decrypt(prKeyPassCode)) {
                resolve(keys[0]);
            }
            else reject('Private key decryption failed'); // Do NOT make this an Error object
        });
    }

    function getHashedPassword(password) {

        var hashed = arrayToBinaryString(window.openpgp.crypto.hash.sha512(password));
        hashed = btoa(hashed);
        return hashed;
    }

    function getNewEncPrivateKey(prKey, oldMailPwd, newMailPwd) {

        if(prKey === undefined) {
            return new Error('Missing private key.');
        }
        else if(oldMailPwd === undefined) {
            return new Error('Missing old Mailbox Password.');
        }
        else if(newMailPwd === undefined) {
            return new Error('Missing new Mailbox Password.');
        }
        var _prKey = openpgp.key.readArmored(prKey).keys[0];
        if(_prKey === undefined) {
            return new Error('Cant read PRK.');
        }
        var ok = _prKey.decrypt(oldMailPwd);
        if(ok) {
            _prKey.primaryKey.encrypt(newMailPwd);
            _prKey.subKeys[0].subKey.encrypt(newMailPwd);
            return _prKey.armor();
        }
        else return -1;
    }

    function binaryStringToArray(str) {
        var bytes = new Uint8Array(str.length);
        for (var i=0; i<str.length; i++) {
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

    function checkMailboxPassword(pubKey, prKey, prKeyPassCode) {
        return new Promise(function(resolve, reject) {
            if (typeof pubKey === 'undefined') {
                return reject(new Error('Missing public key.'));
            }

            if (typeof prKey === 'undefined') {
                return reject(new Error('Missing private key.'));
            }

            if (typeof prKeyPassCode === 'undefined') {
                return reject(new Error('Missing Mailbox Password.'));
            }

            return resolve(); // TODO remove

            var testMsg = "sPKkm9lk6hSSZ49rRFwg";
            var msgPromise = pmcrypto.encryptMessage(testMsg, pubKey, prKeyPassCode); // message, pubKeys, passwords, params
            var keyPromise = pmcrypto.decryptPrivateKey(prKey, prKeyPassCode);

            Promise.all([msgPromise, keyPromise]).then(function(res) {
                return pmcrypto.decryptMessage(res[0], res[1]); // encMessage, key, binary, sessionKeyAlgorithm
            }).then(function(message) {
                console.log(message);
                if (message === testMsg) {
                    return resolve();
                } else {
                    return reject(new Error('Encryption test failed.'));
                }
            }, function(response) {
                return reject(new Error('Decrypt message fail.'));
            });
        });
    }

    var mailboxPassword;

    this.setMailboxPassword = function(pubKey, prKey, password) {
        var testMsg = "sPKkm9lk6hSSZ49rRFwg";
        return '';
    };

    this.$get = function($q) {
        return {
            // returns promise to check password
            checkMailboxPassword: checkMailboxPassword,

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

            // Decrypt private key
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

            // Settings page
            getNewEncPrivateKey: getNewEncPrivateKey
        };
    };
});
