angular.module('proton.core')
    .factory('setupKeys', (
        $log,
        $q,
        CONSTANTS,
        gettextCatalog,
        Key,
        MemberKey,
        notify,
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

        function decryptMemberKey(key = {}, signingKey = {}) {
            return pmcw.decryptMessage(key.Token || key.Activation, signingKey, false, null, signingKey.toPublic().armor())
            .then(({ data, signature }) => {
                if (signature !== 1) {
                    return $q.reject({ message: 'Signature verification failed' });
                }
                return pmcw.decryptPrivateKey(key.PrivateKey, data);
            });
        }

        function getPrimaryKey(member = {}, organizationKey = {}) {

            if (member.Keys.length === 0) {
                return $q.reject({ message: 'Member not set up' });
            }

            return decryptMemberKey(member.Keys[0], organizationKey);
        }

        function prepareSetupPayload(keySalt = '', keys = [], password = '') {
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

        function processMemberKey(mailboxPassword = '', key = '', organizationKey = {}) {

            const randomString = pmcrypto.encode_base64(pmcrypto.arrayToBinaryString(webcrypto.getRandomValues(new Uint8Array(128))));
            let memberKey;

            return pmcw.decryptPrivateKey(key.PrivateKey, mailboxPassword)
            .then((result) => {
                return pmcw.encryptPrivateKey(result, randomString);
            })
            .then((result) => {
                memberKey = result;
                return pmcw.encryptMessage(randomString, organizationKey.toPublic().armor(), [], [organizationKey]);
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

        function processMemberKeys(mailboxPassword = '', keys = [], organizationKey = {}) {

            const promises = [];
            _.each(keys, (key) => {
                promises.push(processMemberKey(mailboxPassword, key, organizationKey));
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

        function memberSetup({ mailboxPassword, keySalt, keys }, password = '', memberID = '', organizationKey = {}) {

            return processMemberKeys(mailboxPassword, keys, organizationKey)
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

        function memberKey(tempPassword = '', key = '', member = {}, organizationKey = {}) {

            return getPrimaryKey(member, organizationKey)
            .then((primaryKey) => {
                return $q.all({
                    user: processMemberKey(tempPassword, key, primaryKey),
                    org: processMemberKey(tempPassword, key, organizationKey)
                });
            })
            .then(({ user, org }) => {

                const payload = _.extend(org, {
                    MemberID: member.ID,
                    Activation: user.Token,
                    UserKey: user.MemberKey
                });

                return MemberKey.create(payload);
            })
            .then(errorHandler);
        }

        function decryptUser(user = {}, organizationKey = {}, mailboxPassword) {

            const privateUser = user.Private === 1;
            const subuser = angular.isDefined(user.OrganizationPrivateKey);

            const keyInfo = (key) => {
                return pmcw.keyInfo(key.PrivateKey).then((info) => {
                    key.created = info.created; // Creation date
                    key.bitSize = info.bitSize; // We don't use this data currently
                    key.fingerprint = info.fingerprint; // Fingerprint
                });
            };

            const activateKey = (key, pkg) => {
                return pmcw.encryptPrivateKey(pkg, mailboxPassword)
                .then((PrivateKey) => Key.activate(key.ID, { PrivateKey }))
                .then(() => pkg);
            };

            const storeKey = ({ key, pkg, address }) => {
                key.decrypted = true; // We mark this key as decrypted
                keyInfo(key);
                return { address, key, pkg };
            };

            const skipKey = ({ key, address, index }) => {
                key.decrypted = false; // This key is not decrypted
                keyInfo(key);
                // If the primary (first) key for address does not decrypt, display error.
                if (index === 0) {
                    address.disabled = true; // This address cannot be used
                    notify({ message: 'Primary key for address ' + address.Email + ' cannot be decrypted. You will not be able to read or write any email from this address', classes: 'notification-danger' });
                }
                return { address, key, pkg: null };
            };

            const promises = [];

            // All user key are decrypted and stored
            const address = { ID: CONSTANTS.MAIN_KEY };
            _.each(user.Keys, (key, index) => {
                if (subuser === true) {
                    promises.push(
                        decryptMemberKey(key, organizationKey)
                        .then((pkg) => storeKey({ key, pkg, address }))
                        );
                } else {
                    promises.push(
                        pmcw.decryptPrivateKey(key.PrivateKey, mailboxPassword)
                        .then(
                            (pkg) => storeKey({ key, pkg, address }),
                            () => skipKey({ key, address, index })
                            )
                        );
                }
            });

            return $q.all(promises).then((primaryKeys) => {

                const promises = [];
                const dirtyAddresses = [];

                // All address keys are decrypted and stored
                _.each(user.Addresses, (address) => {
                    if (address.Keys.length > 0) {
                        let index = 0;
                        _.each(address.Keys, (key) => {
                            if (subuser === true) {
                                promises.push(
                                    decryptMemberKey(key, organizationKey)
                                    .then((pkg) => storeKey({ key, pkg, address }))
                                    );
                            } else if (key.Activation) {
                                promises.push(
                                    decryptMemberKey(key, primaryKeys[0].pkg)
                                    .then((pkg) => activateKey(key, pkg))
                                    .then((pkg) => storeKey({ key, pkg, address }))
                                    );
                            } else {
                                promises.push(
                                    pmcw.decryptPrivateKey(key.PrivateKey, mailboxPassword)
                                    .then(
                                        (pkg) => storeKey({ key, pkg, address }),
                                        () => skipKey({ key, address, index })
                                        )
                                    );
                            }
                            index++;
                        });
                    } else if (address.Status === 1 && privateUser === true) {
                        dirtyAddresses.push(address);
                    }
                });

                return $q.all(promises)
                .then((addressKeys) => {
                    const keys = primaryKeys.concat(addressKeys).filter(({ key }) => key.decrypted);
                    return { keys, dirtyAddresses };
                });
            });
        }

        return {
            decryptMemberKey,
            generate,
            generateAddresses,
            key,
            memberSetup,
            memberKey,
            setup,
            reset,
            decryptUser
        };
    }
);
