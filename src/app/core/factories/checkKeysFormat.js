angular.module('proton.core')
    .factory('checkKeysFormat', (
        passwords,
        pmcw,
        regexEmail
    ) => {

        return (user, keys) => {
            const primaryKeys = keys['0'];
            let allPrivateKeys = primaryKeys;
            let promises = [];

            //For primary keys, we will determine which email to use by comparing their fingerprints with the address keys
            _.each(primaryKeys, (privKey) => {
                const userId = privKey.users[0].userId.userid;
                const fingerprint = privKey.primaryKey.fingerprint;

                let email = "";
                _.each(user.Addresses, (address) => {
                    const foundKey = _.findWhere(address.Keys, { Fingerprint: fingerprint });
                    if (foundKey) {
                        email = address.Email;
                    }
                });
                //If there is no matching fingerprint, we will just make sure the User ID matches the pattern "something <email>"
                if (email === "") {
                    const split = userId.split(" ");
                    if (split.length !== 2) {
                        return Promise.reject('Invalid UserID ' + userId);
                    }
                    const emailWithBrackets = split[1];
                    email = emailWithBrackets.substring(1, emailWithBrackets.length - 1);
                    if (emailWithBrackets[0] !== "<" || emailWithBrackets[emailWithBrackets.length - 1] !== ">" || !regexEmail.test(email)) {
                        return Promise.reject('Invalid UserID ' + userId);
                    }
                }

                const keyInfo =
                    pmcw.keyInfo(privKey.armor(), email, false)
                    .then((info) => {
                        if (info.validationError !== null) {
                            return Promise.reject(info.validationError);
                        }
                    });
                promises.push(keyInfo);
            });

            //Now we check the User IDs of the address keys
            _.each(keys, function(privKeys, addressID) {
                if (addressID !== '0') {
                    const address = _.findWhere(user.Addresses, { ID: addressID });
                    const email = address.Email;
                    allPrivateKeys = allPrivateKeys.concat(privKeys);

                    _.each(privKeys, (privKey) => {
                        const keyInfo =
                            pmcw.keyInfo(privKey.armor(), email, false)
                            .then((info) => {
                                if (info.validationError !== null){
                                    return Promise.reject(info.validationError);
                                }
                            });

                        promises.push(keyInfo);
                    });
                }
            });
            promises.push(pmcw.signMessage(allPrivateKeys));
            return Promise.all(promises);
        };
    });
