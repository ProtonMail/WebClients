angular.module('proton.core')
    .factory('setupKeys', (
        $log,
        $q,
        CONSTANTS,
        gettextCatalog,
        Key,
        MemberKey,
        passwords,
        pmcw,
        webcrypto
    ) => {

        function generate(addresses = [], password = '', numBits = 2048) {

            const keySalt = (CONSTANTS.KEY_PHASE > 1) ? passwords.generateKeySalt() : null;
            const passwordPromise = passwords.computeKeyPassword(password, keySalt);
            const promises = {
                mailboxPassword: passwordPromise,
                keySalt: $q.resolve(keySalt)
            };

            return passwordPromise
                .then((pass) => {
                    const keyPromises = _.map(addresses, ({ Email, ID } = {}) => {
                        return pmcw
                            .generateKeysRSA(`<${Email}>`, pass)
                            .then(({ privateKeyArmored }) => ({
                                AddressID: ID,
                                PrivateKey: privateKeyArmored
                            }));
                    });

                    promises.keys = $q.all(keyPromises);
                    return $q.all(promises);
                });
        }

        function preparePayload(keySalt, keys, password = '') {
            const payload = {
                KeySalt: keySalt,
                AddressKeys: keys
            };

            if (CONSTANTS.KEY_PHASE > 1) {
                payload.PrimaryKey = keys[0].PrivateKey;
            }

            let newPassword = '';
            if (CONSTANTS.KEY_PHASE > 2 && password.length) {
                newPassword = password;
            }

            return {
                payload,
                newPassword
            };
        }

        function processMemberKey(mailboxPassword = '', key = '', organizationPublicKey = '') {

            let randomString = pmcrypto.encode_base64(pmcrypto.arrayToBinaryString(webcrypto.getRandomValues(new Uint8Array(128))));
            let memberKey;

            return pmcw.decryptPrivateKey(key.PrivateKey, mailboxPassword)
            .then((result) => {
                return pmcw.encryptPrivateKey(result, randomString);
            })
            .then((result) => {
                memberKey = result;
                return pmcw.encryptMessage(randomString, organizationPublicKey);
            })
            .then(function(token) {
                return {
                    AddressID: key.AddressID,
                    UserKey: key.PrivateKey,
                    MemberKey: memberKey,
                    Token: token
                };
            });
        }

        function processMemberKeys(mailboxPassword = '', keys = [], organizationPublicKey = '') {

            let promises = [];
            _.each(keys, (key) => {
                promises.push(processMemberKey(mailboxPassword, key, organizationPublicKey));
            });

            return $q.all(promises);
        }

        function errorHandler({ data }) {
            if (data && data.Code === 1000) {
                return $q.resolve(data.User);
            } else if (data && data.Error) {
                return $q.reject({ message: data.Error });
            }
            return $q.reject({ message: 'Something went wrong during key setup' });
        }

        function reset({keySalt, keys}, password = '', params = {}) {

            const rv = preparePayload(keySalt, keys, password);
            rv.payload = _.extend(rv.payload, params);

            return Key.reset(rv.payload, rv.newPassword)
            .then(errorHandler);
        }

        function setup({keySalt, keys}, password = '') {

            const rv = preparePayload(keySalt, keys, password);

            return Key.setup(rv.payload, rv.newPassword)
            .then(errorHandler);
        }

        function member({mailboxPassword, keySalt, keys}, password = '', memberID = '', organizationPublicKey = '') {

            return processMemberKeys(mailboxPassword, keys, organizationPublicKey)
            .then((result) => {
                return MemberKey.setup({
                    MemberID: memberID,
                    KeySalt: keySalt,
                    AddressKeys: result,
                    PrimaryKey: result[0]
                }, password);
            })
            .then(errorHandler);
        }

        return {
            generate,
            member,
            setup,
            reset
        };
    }
);
