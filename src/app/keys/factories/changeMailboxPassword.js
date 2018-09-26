import { PAID_ADMIN_ROLE } from '../../constants';

/* @ngInject */
function changeMailboxPassword(
    $log,
    addressesModel,
    authentication,
    gettextCatalog,
    Key,
    networkActivityTracker,
    organizationApi,
    passwords,
    pmcw,
    User
) {
    /**
     * Instead of grab keys from the cache, we call the back-end, just to make sure everything is up to date
     * @param {String} newMailPwd
     * @param {String} keySalt
     * @return {Promise}
     */
    function getUser(newMailPwd = '', keySalt = '') {
        return Promise.all([passwords.computeKeyPassword(newMailPwd, keySalt), User.get()]).then(
            ([password, user = {}]) => ({ password, user })
        );
    }

    /**
     * Change organization keys
     * @param  {String} password
     * @param  {Object} user
     * @return {Promise}
     */
    function manageOrganizationKeys(password = '', oldMailPwd = '', user = {}) {
        if (user.Role === PAID_ADMIN_ROLE) {
            // Get organization key
            return organizationApi.getKeys().then(({ data = {} } = {}) => {
                const encryptPrivateKey = data.PrivateKey;

                // Decrypt organization private key with the old mailbox password (current)
                // then encrypt private key with the new mailbox password
                // return 0 on failure to decrypt, other failures are fatal
                return pmcw
                    .decryptPrivateKey(encryptPrivateKey, oldMailPwd)
                    .then((pkg) => pmcw.encryptPrivateKey(pkg, password), () => 0);
            });
        }
        return Promise.resolve(0);
    }

    function manageUserKeys(password = '', oldMailPwd = '', user = {}) {
        const inputKeys = [];
        // Collect user keys
        user.Keys.forEach((key) => inputKeys.push(key));
        // Collect address keys
        addressesModel.getByUser(user).forEach((address) => {
            address.Keys.forEach((key) => inputKeys.push(key));
        });
        // Re-encrypt all keys, if they can be decrypted
        let promises = [];
        if (user.OrganizationPrivateKey) {
            // Sub-user
            const organizationKey = pmcw.decryptPrivateKey(user.OrganizationPrivateKey, oldMailPwd);

            promises = inputKeys.map(({ PrivateKey, ID, Token }) => {
                // Decrypt private key with organization key and token
                return organizationKey
                    .then((key) => pmcw.decryptMessage({ message: pmcw.getMessage(Token), privateKeys: [key] }))
                    .then(({ data }) => pmcw.decryptPrivateKey(PrivateKey, data))
                    .then((pkg) => ({ ID, pkg }));
            });
        } else {
            // Not sub-user
            promises = inputKeys.map(({ PrivateKey, ID }) => {
                // Decrypt private key with the old mailbox password
                return pmcw.decryptPrivateKey(PrivateKey, oldMailPwd).then((pkg) => ({ ID, pkg }));
            });
        }

        return promises.map((promise) => {
            return (
                promise
                    // Encrypt the key with the new mailbox password
                    .then(
                        ({ ID, pkg }) => {
                            return pmcw.encryptPrivateKey(pkg, password).then((PrivateKey) => ({ ID, PrivateKey }));
                        },
                        (error) => {
                            // Cannot decrypt, return 0 (not an error)
                            $log.error(error);
                            return 0;
                        }
                    )
            );
        });
    }

    function sendNewKeys({ keys = [], keySalt = '', organizationKey = 0, newLoginPassword = '' }) {
        const keysFiltered = keys.filter((key) => key !== 0);
        const payload = { KeySalt: keySalt, Keys: keysFiltered };

        if (keysFiltered.length === 0) {
            throw new Error(gettextCatalog.getString('No keys to update', null, 'Error'));
        }

        if (organizationKey !== 0) {
            payload.OrganizationKey = organizationKey;
        }

        return Key.updatePrivate(payload, newLoginPassword);
    }

    return ({ newPassword = '', onePassword = false }) => {
        const oldMailPwd = authentication.getPassword();
        const keySalt = passwords.generateKeySalt();
        const newLoginPassword = onePassword ? newPassword : '';
        let passwordComputed;
        const promise = getUser(newPassword, keySalt)
            .then(({ password = '', user = {} }) => {
                passwordComputed = password;

                const promises = [];
                const collection = manageUserKeys(passwordComputed, oldMailPwd, user);

                promises.push(manageOrganizationKeys(passwordComputed, oldMailPwd, user));
                collection.forEach((promise) => promises.push(promise));

                return Promise.all(promises);
            })
            .then(([organizationKey, ...keys]) =>
                sendNewKeys({
                    keys,
                    keySalt,
                    organizationKey,
                    newLoginPassword
                })
            )
            .then(() => authentication.savePassword(passwordComputed));
        networkActivityTracker.track(promise);
        return promise;
    };
}
export default changeMailboxPassword;
