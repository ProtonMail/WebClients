angular.module('proton.authentication')
.provider('pmcw', function pmcwProvider() {
    pmcrypto.checkMailboxPassword = function (prKey, prKeyPassCode, accessToken) {

        return new Promise((resolve, reject) => {

            if (typeof prKey === 'undefined') {
                return reject(new Error('Missing private key.'));
            }

            if (typeof prKeyPassCode === 'undefined') {
                return reject(new Error('Missing Mailbox Password.'));
            }

            const keyPromise = pmcrypto.decryptPrivateKey(prKey, prKeyPassCode);

            keyPromise
            .then(
                (res) => {
                    // this is the private key, use this and decryptMessage to get the access token
                    const privateKey = res;
                    pmcrypto.decryptMessage(accessToken, privateKey)
                    .then(
                        (resp) => {
                            return resolve({ password: prKeyPassCode, token: resp.data });
                        },
                        () => {
                            return reject(new Error('Unable to get Access Token.'));
                        }
                    );
                },
                () => {
                    return reject(new Error('Wrong Mailbox Password.'));
                }
            );
        });
    };

    this.$get = function () {
        return pmcrypto;
    };
});
