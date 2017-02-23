angular.module('proton.core')
    .factory('checkKeysFormat', (
        passwords,
        pmcw,
        regexEmail
    ) => {

        return (user, keys) => {
            const primaryKeys = keys['0'];
            let allPrivateKeys = primaryKeys;

            //For primary keys, we will determine which email to use by comparing their fingerprints with the address keys
            let promises = _.reduce(primaryKeys, (acc, privKey) => {
                const userId = privKey.users[0].userId.userid;
                const fingerprint = privKey.primaryKey.fingerprint;

                let email = '';
                _.each(user.Addresses, (address) => {
                    const foundKey = _.findWhere(address.Keys, { Fingerprint: fingerprint });
                    if (foundKey) {
                        email = address.Email;
                    }
                });
                //If there is no matching fingerprint, we will just make sure the User ID matches the pattern "something <email>"
                if (!email.length) {
                    const split = userId.split(' ');
                    if (split.length !== 2) {
                        acc.push(Promise.reject('Invalid UserID ' + userId));
                        return;
                    }
                    const emailWithBrackets = split[1];
                    email = emailWithBrackets.substring(1, emailWithBrackets.length - 1);
                    if (emailWithBrackets[0] !== '<' || emailWithBrackets[emailWithBrackets.length - 1] !== '>' || !regexEmail.test(email)) {
                        acc.push(Promise.reject('Invalid UserID ' + userId));
                        return;
                    }
                }

                const keyInfo =
                    pmcw.keyInfo(privKey.armor(), email, false)
                    .then((info) => {
                        if (info.validationError) {
                            return Promise.reject(info.validationError);
                        }
                    });
                acc.push(keyInfo);
                return acc;
            }, []);

            //Now we check the User IDs of the address keys
            promises = _.reduce(keys, (acc, privKeys, addressID) => {
                if (addressID !== '0') {
                    const address = _.findWhere(user.Addresses, { ID: addressID });
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
            }, promises);

            promises.push(pmcw.signMessage(allPrivateKeys));
            return Promise.all(promises);
        };
    });
