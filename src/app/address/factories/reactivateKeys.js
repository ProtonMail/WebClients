import _ from 'lodash';

/* @ngInject */
function reactivateKeys(authentication, Key, eventManager, gettextCatalog, passwords, pmcw) {
    const I18N = {
        incorrect: gettextCatalog.getString('Incorrect decryption password', null, 'Error'),
        error: gettextCatalog.getString('Error reactivating key. Please try again', null, 'Error')
    };
    const process = async (keys = [], oldPassword) => {
        const { data = {} } = await Key.salts();
        const salts = _.reduce(
            keys,
            (acc, key) => {
                const { KeySalt } = _.find(data.KeySalts, { ID: key.ID }) || {};

                if (KeySalt) {
                    acc.push({ KeySalt, key });
                }

                return acc;
            },
            []
        );

        const promises = _.map(salts, ({ KeySalt, key }) => {
            return passwords
                .computeKeyPassword(oldPassword, KeySalt)
                .then((keyPassword) => pmcw.decryptPrivateKey(key.PrivateKey, keyPassword))
                .then(
                    (decryptedKey) => pmcw.encryptPrivateKey(decryptedKey, authentication.getPassword()),
                    () => {
                        throw Error(I18N.incorrect);
                    }
                )
                .then((privateKey) => Key.reactivate(key.ID, { PrivateKey: privateKey }))
                .then(({ data = {} } = {}) => {
                    key.decrypted = true;
                    return data;
                })
                .catch(({ data = {} } = {}) => {
                    throw new Error(data.Error || I18N.error);
                });
        });

        return Promise.all(promises).then(eventManager.call);
    };
    return process;
}
export default reactivateKeys;
