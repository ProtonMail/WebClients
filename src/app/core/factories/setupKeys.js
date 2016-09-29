angular.module('proton.core')
    .factory('setupKeys', (
        $log,
        $q,
        CONSTANTS,
        gettextCatalog,
        Key,
        passwords,
        pmcw
    ) => {

        function generate(addresses = [], password = '') {

            const keySalt = (CONSTANTS.KEY_PHASE > 1) ? passwords.generateKeySalt() : null;
            const passwordPromise = passwords.computeKeyPassword(password, keySalt);
            const promises = {
                mailboxPassword: passwordPromise,
                keySalt: $q.resolve(keySalt),
            };

            return passwordPromise
            .then((pass) => {

                const keyPromises = [];
                _.each(addresses, (address) => {
                    keyPromises.push(
                        pmcw.generateKeysRSA('<'+address.Email+'>', pass)
                        .then((response) => ({
                            AddressID: address.ID,
                            PrivateKey: response.privateKeyArmored
                        }))
                    );
                });

                promises.keys = $q.all(keyPromises);
                return $q.all(promises);
            });
        }

        function preparePayload(mailboxPassword, keySalt, keys, password = '') {
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

        function errorHandler({ data }) {
            if (data && data.Code === 1000) {
                return $q.resolve(data.User);
            } else if (data && data.Error) {
                return $q.reject({message: data.Error});
            }
            return $q.reject({message: 'Something went wrong during key setup'});
        }

        function reset({mailboxPassword, keySalt, keys}, password = '', params = {}) {

            const rv = preparePayload(mailboxPassword, keySalt, keys, password);
            rv.payload = _.extend(rv.payload, params);

            return Key.reset(rv.payload, rv.newPassword)
            .then(errorHandler);
        }

        function setup({mailboxPassword, keySalt, keys}, password = '') {

            const rv = preparePayload(mailboxPassword, keySalt, keys, password);

            return Key.setup(rv.payload, rv.newPassword)
            .then(errorHandler);
        }

        return {
            generate,
            setup,
            reset
        };
    }
);
