angular.module('proton.core')
    .factory('changeMailboxPassword', (
        $log,
        $q,
        authentication,
        CONSTANTS,
        gettextCatalog,
        Key,
        networkActivityTracker,
        notify,
        Organization,
        passwords,
        pmcw,
        User
    ) => {
        /**
         * Instead of grab keys from the cache, we call the back-end, just to make sure everything is up to date
         * @param {String} newMailPwd
         * @param {String} keySalt
         * @return {Promise}
         */
        function getUser(newMailPwd = '', keySalt = '') {
            const deferred = $q.defer();

            $q.all([passwords.computeKeyPassword(newMailPwd, keySalt), User.get()])
            .then(([password, result]) => {
                if (result.data && result.data.Code === 1000) {
                    deferred.resolve({ password, user: result.data.User });
                } else if (result.data && result.data.Error) {
                    deferred.reject(result.data.Error);
                } else {
                    deferred.reject(gettextCatalog.getString('Unable to save your changes, please try again.', null, 'Error'));
                }
            });

            return deferred.promise;
        }

        /**
         * Change organization keys
         * @param  {String} password
         * @param  {Object} user
         * @return {Promise}
         */
        function manageOrganizationKeys(password = '', oldMailPwd = '', user = {}) {
            const deferred = $q.defer();

            if (user.Role === 2) {
                // Get organization key
                Organization.getKeys()
                .then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        const encryptPrivateKey = result.data.PrivateKey;

                        // Decrypt organization private key with the old mailbox password (current)
                        // then encrypt private key with the new mailbox password
                        // return 0 on failure to decrypt, other failures are fatal
                        pmcw.decryptPrivateKey(encryptPrivateKey, oldMailPwd)
                        .then(
                            (pkg) => deferred.resolve(pmcw.encryptPrivateKey(pkg, password)),
                            () => deferred.resolve(0)
                        );
                    } else if (result.data && result.data.Error) {
                        deferred.reject(result.data.Error);
                    } else {
                        deferred.reject(gettextCatalog.getString('Unable to get organization keys', null, 'Error'));
                    }
                });
            } else {
                deferred.resolve(0);
            }

            return deferred.promise;
        }

        function manageUserKeys(password = '', oldMailPwd = '', user = {}) {
            const inputKeys = [];
            // Collect user keys
            user.Keys.forEach((key) => inputKeys.push(key));
            // Collect address keys
            user.Addresses.forEach((address) => { address.Keys.forEach((key) => inputKeys.push(key)); });
            // Re-encrypt all keys, if they can be decrypted
            let promises = [];
            if (user.OrganizationPrivateKey) {
                // Sub-user
                const organizationKey = pmcw.decryptPrivateKey(user.OrganizationPrivateKey, oldMailPwd);

                promises = inputKeys.map(({ PrivateKey, ID, Token }) => {
                    // Decrypt private key with organization key and token
                    return organizationKey
                    .then((key) => pmcw.decryptMessage(Token, key).data)
                    .then((token) => pmcw.decryptPrivateKey(PrivateKey, token))
                    .then((pkg) => ({ ID, pkg }));
                });
            } else {
                // Not sub-user
                promises = inputKeys.map(({ PrivateKey, ID }) => {
                    // Decrypt private key with the old mailbox password
                    return pmcw.decryptPrivateKey(PrivateKey, oldMailPwd)
                    .then((pkg) => ({ ID, pkg }));
                });
            }

            return promises.map((promise) => {
                return promise
                // Encrypt the key with the new mailbox password
                .then(
                    ({ ID, pkg }) => {
                        return pmcw.encryptPrivateKey(pkg, password)
                        .then((PrivateKey) => ({ ID, PrivateKey }));
                    },
                    (error) => {
                        // Cannot decrypt, return 0 (not an error)
                        $log.error(error);
                        return 0;
                    }
                );
            });
        }

        function sendNewKeys({ keys = [], keySalt = '', organizationKey = 0, newLoginPassword = '' }) {
            const keysFiltered = keys.filter((key) => key !== 0);
            const payload = {
                KeySalt: keySalt,
                Keys: keysFiltered
            };

            if (keysFiltered.length === 0) {
                notify({ message: gettextCatalog.getString('No keys to update', null, 'Error'), classes: 'notification-danger' });
            }

            if (organizationKey !== 0) {
                payload.OrganizationKey = organizationKey;
            }

            return Key.private(payload, newLoginPassword);
        }

        return ({ newPassword = '', onePassword = false }) => {
            const oldMailPwd = authentication.getPassword();
            const keySalt = (CONSTANTS.KEY_PHASE > 1) ? passwords.generateKeySalt() : null;
            const newLoginPassword = onePassword ? newPassword : '';
            let passwordComputed;

            return networkActivityTracker.track(
                getUser(newPassword, keySalt)
                .then(({ password = '', user = {} }) => {
                    passwordComputed = password;

                    const promises = [];
                    const collection = manageUserKeys(passwordComputed, oldMailPwd, user);

                    promises.push(manageOrganizationKeys(passwordComputed, oldMailPwd, user));
                    collection.forEach((promise) => promises.push(promise));

                    return $q.all(promises);
                })
                .then(([organizationKey, ...keys]) => sendNewKeys(
                    {
                        keys,
                        keySalt,
                        organizationKey,
                        newLoginPassword
                    }))
                .then(() => {
                    authentication.savePassword(passwordComputed);
                })
                .catch((error) => {
                    return Promise.reject(error);
                }));
        };
    });
