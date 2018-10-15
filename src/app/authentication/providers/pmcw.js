/* @ngInject */
function pmcw() {
    pmcrypto.checkMailboxPassword = (prKey, prKeyPassCode, accessToken) => {
        return new Promise((resolve, reject) => {
            if (typeof prKey === 'undefined') {
                return reject(new Error('Missing private key.'));
            }

            if (typeof prKeyPassCode === 'undefined') {
                return reject(new Error('Missing Mailbox Password.'));
            }

            const keyPromise = pmcrypto.decryptPrivateKey(prKey, prKeyPassCode);

            keyPromise
                .then((privateKey) => {
                    // It can be a clearText key
                    if (!/^-----BEGIN PGP MESSAGE-----/.test(accessToken)) {
                        return resolve({ password: prKeyPassCode, token: accessToken });
                    }

                    const message = pmcrypto.getMessage(accessToken);
                    // this is the private key, use this and decryptMessage to get the access token
                    pmcrypto
                        .decryptMessage({ message, privateKeys: [privateKey] })
                        .then(({ data }) => resolve({ password: prKeyPassCode, token: data }))
                        .catch(() => reject(new Error('Unable to get Access Token.')));
                })
                .catch(() => reject(new Error('Wrong Mailbox Password.')));
        });
    };

    this.$get = () => pmcrypto;
}
export default pmcw;
