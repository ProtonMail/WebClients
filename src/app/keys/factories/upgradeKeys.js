import _ from 'lodash';
import { decryptPrivateKey, reformatKey } from 'pmcrypto';
import { generateKeySalt, computeKeyPassword } from 'pm-srp';

import { PAID_ADMIN_ROLE } from '../../constants';

/* @ngInject */
function upgradeKeys($log, $injector, gettextCatalog, Key, organizationApi, authenticationStore) {
    /**
     * Reformat organization keys
     * @param  {String} password
     * @param  {String} oldSaltedPassword
     * @param  {Object} user
     * @return {Promise}
     */
    async function manageOrganizationKeys(password = '', oldSaltedPassword = '', user = {}) {
        if (user.Role !== PAID_ADMIN_ROLE) {
            return 0;
        }

        const { PrivateKey } = await organizationApi.getKeys();
        const [{ Email: email }] = $injector.get('addressesModel').getByUser(user) || {};

        try {
            const decryptedPrivateKey = await decryptPrivateKey(PrivateKey, oldSaltedPassword);
            const { privateKeyArmored } = await reformatKey({
                privateKey: decryptedPrivateKey,
                userIds: [{ name: email, email }],
                passphrase: password
            });
            return privateKeyArmored;
        } catch (e) {
            // Ignore organization key if it can not be decrypted
            return 0;
        }
    }

    const collectUserKeys = ({ Keys = [] } = {}) => {
        const addresses = $injector.get('addressesModel').get();

        return Keys.reduce(
            (acc, key) => {
                acc.keys.push(key);
                let foundKey = null;
                addresses.forEach((address) => {
                    foundKey = _.find(address.Keys, { Fingerprint: key.Fingerprint });
                    if (foundKey) {
                        acc.emails[key.ID] = address.Email;
                    }
                });

                if (!foundKey) {
                    acc.emails[key.ID] = addresses[0].Email;
                }
                return acc;
            },
            { keys: [], emails: {} }
        );
    };

    const collectAddressKeys = () => {
        const addresses = $injector.get('addressesModel').get();
        return addresses.reduce(
            (acc, { Keys = [], Email } = {}) => {
                Keys.forEach((key) => {
                    acc.keys.push(key);
                    acc.emails[key.ID] = Email;
                });
                return acc;
            },
            { keys: [], emails: {} }
        );
    };

    /**
     * Reformat user keys
     * @param  {String} password
     * @param  {String} oldSaltedPassword
     * @param  {Object} user
     * @return {Array<Promise>}
     */
    function manageUserKeys(password = '', oldSaltedPassword = '', user = {}) {
        const keysUser = collectUserKeys(user);
        const keysAddresses = collectAddressKeys();

        const inputKeys = [].concat(keysUser.keys, keysAddresses.keys);

        const emailAddresses = {
            ...keysUser.emails,
            ...keysAddresses.emails
        };

        // Reformat all keys, if they can be decrypted
        return inputKeys.map(async ({ PrivateKey, ID }) => {
            try {
                const email = emailAddresses[ID];
                const decryptedPrivateKey = await decryptPrivateKey(PrivateKey, oldSaltedPassword);

                const { privateKeyArmored } = await reformatKey({
                    privateKey: decryptedPrivateKey,
                    userIds: [{ name: email, email }],
                    passphrase: password
                });
                return {
                    ID,
                    PrivateKey: privateKeyArmored
                };
            } catch (e) {
                // Ignore keys that can't be decrypted
                return 0;
            }
        });
    }
    /**
     * Send newly reformatted keys to backend
     * @param  {Array} keys
     * @param  {String} keySalt
     * @param  {Object} organizationKey
     * @param  {String} loginPassword
     * @return {Promise}
     */
    function sendNewKeys({ keys = [], keySalt = '', organizationKey = 0, loginPassword = '' }) {
        const keysFiltered = keys.filter((key) => key !== 0);

        if (keysFiltered.length === 0) {
            throw new Error(gettextCatalog.getString('No keys to update', null, 'Error'));
        }

        const payload = { KeySalt: keySalt, Keys: keysFiltered };
        if (organizationKey !== 0) {
            payload.OrganizationKey = organizationKey;
        }

        return Key.upgrade(payload, loginPassword);
    }

    return ({ mailboxPassword = '', oldSaltedPassword = '', user = {} }) => {
        let passwordComputed = '';
        const keySalt = generateKeySalt();
        const loginPassword = user.PasswordMode === 1 ? mailboxPassword : '';

        return computeKeyPassword(mailboxPassword, keySalt)
            .then((password) => {
                passwordComputed = password;
                const collection = manageUserKeys(passwordComputed, oldSaltedPassword, user);
                const promises = [].concat(
                    manageOrganizationKeys(passwordComputed, oldSaltedPassword, user),
                    collection
                );
                return Promise.all(promises);
            })
            .then(([organizationKey, ...keys]) =>
                sendNewKeys({
                    keys,
                    keySalt,
                    organizationKey,
                    loginPassword
                })
            )
            .then(() => {
                authenticationStore.setPassword(passwordComputed);
            });
    };
}
export default upgradeKeys;
