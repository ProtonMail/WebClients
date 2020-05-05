import { decryptPrivateKey, reformatKey } from 'pmcrypto';
import { generateKeySalt, computeKeyPassword } from 'pm-srp';

import { MAIN_KEY, PAID_ADMIN_ROLE } from '../../constants';

/* @ngInject */
function upgradeKeys(
    $log,
    $injector,
    gettextCatalog,
    Key,
    organizationApi,
    authenticationStore,
    userSettingsModel,
    keysModel
) {
    /**
     * Reformat organization keys
     * @param  {String} password
     * @param  {String} oldSaltedPassword
     * @param  {Object} user
     * @return {Promise}
     */
    async function getReformattedOrganizationKey(password = '', oldSaltedPassword = '', user = {}) {
        if (user.Role !== PAID_ADMIN_ROLE) {
            return;
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
        }
    }

    const getDecryptedKeys = (keys) => keys.filter(({ pkg }) => !!pkg);

    const getUserKeys = () => {
        const addresses = $injector.get('addressesModel').get();
        const userKeys = keysModel.getAllKeys(MAIN_KEY);
        const decryptedUserKeys = getDecryptedKeys(userKeys);
        const [primaryAddress] = addresses;

        return decryptedUserKeys.map((key) => {
            return {
                address: primaryAddress,
                keys: [key]
            };
        });
    };

    const getAddressKeys = () => {
        const addresses = $injector.get('addressesModel').get();
        return addresses
            .map((address) => ({
                address,
                keys: getDecryptedKeys(keysModel.getAllKeys(address.ID))
            }))
            .filter(({ keys }) => keys.length > 0);
    };

    /**
     * Reformat user keys
     * @param  {String} password
     * @return {Array<Promise>}
     */
    function getReformattedUserAndAddressKeys(password = '') {
        const addressKeys = getAddressKeys();
        const userKeys = getUserKeys();

        const promises = [...addressKeys, ...userKeys].flatMap(({ address, keys }) => {
            const { Email: email } = address;

            return keys.map(async ({ key, pkg }) => {
                const { privateKeyArmored } = await reformatKey({
                    privateKey: pkg,
                    userIds: [{ name: email, email }],
                    passphrase: password
                });

                return {
                    ID: key.ID,
                    PrivateKey: privateKeyArmored
                };
            });
        });

        // Reformat all keys that can be decrypted with the new password
        return Promise.all(promises);
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
        const payload = { KeySalt: keySalt, Keys: keys };

        if (organizationKey) {
            payload.OrganizationKey = organizationKey;
        }

        return Key.upgrade(payload, loginPassword);
    }

    return async ({ plainMailboxPass = '', oldSaltedPassword = '', user = {} }) => {
        const keySalt = generateKeySalt();
        const userPasswordMode = userSettingsModel.get('PasswordMode');
        const loginPassword = userPasswordMode === 1 ? plainMailboxPass : '';

        const newMailboxPassword = await computeKeyPassword(plainMailboxPass, keySalt);

        const [organizationKey, addressAndUserKeys] = await Promise.all([
            getReformattedOrganizationKey(newMailboxPassword, oldSaltedPassword, user),
            getReformattedUserAndAddressKeys(newMailboxPassword)
        ]);

        // If no keys. Should never end up here.
        if (!organizationKey && !addressAndUserKeys.length) {
            return;
        }

        await sendNewKeys({
            keys: addressAndUserKeys,
            keySalt,
            organizationKey,
            loginPassword
        });

        authenticationStore.setPassword(newMailboxPassword);
    };
}
export default upgradeKeys;
