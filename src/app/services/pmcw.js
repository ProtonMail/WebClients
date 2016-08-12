angular.module("proton.pmcw", [])

// Proton Mail Crypto Wrapper
.provider("pmcw", function pmcwProvider() {
    pmcrypto.checkMailboxPassword = function(prKey, prKeyPassCode, accessToken) {

        return new Promise(function(resolve, reject) {

            if (typeof prKey === 'undefined') {
                return reject(new Error('Missing private key.'));
            }

            if (typeof prKeyPassCode === 'undefined') {
                return reject(new Error('Missing Mailbox Password.'));
            }

            var keyPromise = pmcrypto.decryptPrivateKey(prKey, prKeyPassCode);

            keyPromise
            .then(
                function(res) {
                    // this is the private key, use this and decryptMessage to get the access token
                    var privateKey = res;
                    pmcrypto.decryptMessage(accessToken, privateKey)
                    .then(
                        function(resp) {
                            return resolve(resp);
                        },
                        function(error) {
                            return reject(new Error('Unable to get Access Token.'));
                        }
                    );
                },
                function(err) {
                    return reject(new Error('Wrong Mailbox Password.'));
                }
            );
        });
    };

    this.$get = function($q) {
        return pmcrypto;
    };
});
