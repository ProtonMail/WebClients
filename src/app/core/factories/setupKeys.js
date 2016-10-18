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
                            .generateKeysRSA(`${Email}`, pass, numBits)
                            .then(({ privateKeyArmored }) => ({
                                AddressID: ID,
                                PrivateKey: privateKeyArmored
                            }));
                    });

                    promises.keys = $q.all(keyPromises);
                    return $q.all(promises);
                });
        }

        function generateAddresses(addresses = [], mailboxPassword = '', numBits = 2048) {

            const promises = _.map(addresses, ({ Email, ID } = {}) => {
                return pmcw
                    .generateKeysRSA(`${Email}`, mailboxPassword, numBits)
                    .then(({ privateKeyArmored }) => ({
                        AddressID: ID,
                        PrivateKey: privateKeyArmored
                    }));
            });

            return $q.all(promises);
        }

        function prepareSetupPayload(keySalt, keys, password = '') {
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

            const randomString = pmcrypto.encode_base64(pmcrypto.arrayToBinaryString(webcrypto.getRandomValues(new Uint8Array(128))));
            let memberKey;

            return pmcw.decryptPrivateKey(key.PrivateKey, mailboxPassword)
            .then((result) => {
                return pmcw.encryptPrivateKey(result, randomString);
            })
            .then((result) => {
                memberKey = result;
                return pmcw.encryptMessage(randomString, organizationPublicKey);
            })
            .then((token) => {
                return {
                    AddressID: key.AddressID,
                    UserKey: key.PrivateKey,
                    MemberKey: memberKey,
                    Token: token
                };
            });
        }

        function processMemberKeys(mailboxPassword = '', keys = [], organizationPublicKey = '') {

            const promises = [];
            _.each(keys, (key) => {
                promises.push(processMemberKey(mailboxPassword, key, organizationPublicKey));
            });

            return $q.all(promises);
        }

        function errorHandler({ data }) {
            if (data && data.Code === 1000) {
                return $q.resolve(data.User || data.Member || data.MemberKey);
            } else if (data && data.Error) {
                return $q.reject({ message: data.Error });
            }
            return $q.reject({ message: 'Something went wrong during key setup' });
        }

        function reset({ keySalt, keys }, password = '', params = {}) {

            const rv = prepareSetupPayload(keySalt, keys, password);
            rv.payload = _.extend(rv.payload, params);

            return Key.reset(rv.payload, rv.newPassword)
            .then(errorHandler);
        }

        function setup({ keySalt, keys }, password = '') {

            const rv = prepareSetupPayload(keySalt, keys, password);

            return Key.setup(rv.payload, rv.newPassword)
            .then(errorHandler);
        }

        function memberSetup({ mailboxPassword, keySalt, keys }, password = '', memberID = '', organizationPublicKey = '') {

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

        function key(key) {

            return Key.create(key)
            .then(errorHandler);
        }

        function memberKey(tempPassword, key, member = {}, organizationPublicKey = '') {

            return $q.all({
                user: processMemberKey(tempPassword, key, member.PublicKey),
                org: processMemberKey(tempPassword, key, organizationPublicKey)
            })
            .then(({ user, org }) => {

                const payload = _.extend(org, {
                    MemberID: member.ID,
                    Activation: user.Token,
                    UserKey: user.UserKey
                });

                return MemberKey.create(payload);
            })
            .then(errorHandler);
        }

        return {
            generate,
            generateAddresses,
            key,
            memberSetup,
            memberKey,
            setup,
            reset
        };
    }
);
