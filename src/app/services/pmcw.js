angular.module("proton.pmcw", [])

// Proton Mail Crypto Wrapper
.provider("pmcw", function pmcwProvider() {
    pmcrypto.mailboxPassword = '';

    this.setMailboxPassword = function(password) {
        pmcrypto.mailboxPassword = password;
    };

    pmcrypto.checkMailboxPassword = function(pubKey, prKey, prKeyPassCode) {
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
    };

    this.$get = function($q) {
        return pmcrypto;
    };
});
