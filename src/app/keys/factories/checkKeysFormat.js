angular.module('proton.keys')
    .factory('checkKeysFormat', (
        CONSTANTS,
        passwords,
        pmcw,
        regexEmail
    ) => {
        /**
         * Get email address corresponding to a key fingerprint
         * @param  {Array} addresses
         * @param  {String} fingerprint
         * @return {String} email
         */
        function getEmailFromFingerprint(addresses = [], fingerprint = '') {
            let email = '';
            _.each(addresses, (address) => {
                const foundKey = _.findWhere(address.Keys, { Fingerprint: fingerprint });
                if (foundKey) {
                    email = address.Email;
                }
            });
            return email;
        }
        /**
         * Validate a key's userID without a known email
         * @param  {String} userId
         * @return {bool}
         */
        function validUserIDUnknownEmail(userId = '') {
            const split = userId.split(' ');
            if (split.length !== 2) {
                return false;
            }
            const emailWithBrackets = split[1];
            const emailWithoutBrackets = emailWithBrackets.substring(1, emailWithBrackets.length - 1);
            if (emailWithBrackets[0] !== CONSTANTS.EMAIL_FORMATING['OPEN_TAG_AUTOCOMPLETE_RAW'] || emailWithBrackets[emailWithBrackets.length - 1] !== CONSTANTS.EMAIL_FORMATING['CLOSE_TAG_AUTOCOMPLETE_RAW'] || !regexEmail.test(emailWithoutBrackets)) {
                return false;
            }
            return true;
        }
        /**
         * Get the validation promises corresponding to the primary keys
         * @param  {Array} primaryKeys
         * @param  {Array} addresses
         * @return {Array}
         */
        function getPrimaryKeyPromises(primaryKeys = [], addresses = []) {
            //For primary keys, we will determine which email to use by comparing their fingerprints with the address keys
            return _.reduce(primaryKeys, (acc, privKey) => {
                const userId = privKey.users[0].userId.userid;
                const fingerprint = privKey.primaryKey.fingerprint;

                const email = getEmailFromFingerprint(addresses, fingerprint);

                //If there is no matching fingerprint, we will just make sure the User ID matches the pattern "something <email>"
                if (!email.length) {
                    if (!validUserIDUnknownEmail(userId)) {
                        acc.push(Promise.reject(new Error('Invalid UserID ' + userId)));
                        return acc;
                    }
                }

                const keyInfo =
                    pmcw.keyInfo(privKey.armor(), email, false)
                    .then((info) => {
                        if (info.validationError) {
                            throw new Error(info.validationError);
                        }
                    });
                acc.push(keyInfo);
                return acc;
            }, []);
        }
        /**
         * Get the validation promises corresponding to the address keys
         * @param  {Array} addressKeys
         * @param  {Array} addresses
         * @return {Array}
         */
        function getAddressKeyPromises(keys = [], addresses = []) {
            let allPrivateKeys = [];

            let promises = _.reduce(keys, (acc, privKeys, addressID) => {
                if (addressID !== '0') {
                    const address = _.findWhere(addresses, { ID: addressID });
                    const email = address.Email;

                    allPrivateKeys = allPrivateKeys.concat(privKeys);

                    _.each(privKeys, (privKey) => {
                        const keyInfo =
                            pmcw.keyInfo(privKey.armor(), email, false)
                            .then((info) => {
                                if (info.validationError) {
                                    return Promise.reject(info.validationError);
                                }
                            });
                        acc.push(keyInfo);
                    });
                }
                return acc;
            }, []);

            promises.push(pmcw.signMessage(allPrivateKeys));
            return promises;
        }

        return (user, keys) => {
            const primaryKeys = keys['0'];
            const primaryKeyPromises = getPrimaryKeyPromises(primaryKeys, user.Addresses);
            const addressKeyPromises = getAddressKeyPromises(keys, user.Addresses);

            return Promise.all(primaryKeyPromises.concat(addressKeyPromises));
        };
    });
