import _ from 'lodash';
import { MAIN_KEY } from '../../constants';

/* @ngInject */
function decryptKeys(pmcw, notification, Key, keyInfo, setupKeys, gettextCatalog) {
    const I18N = {
        errorPrimaryKey({ Email: email = '' }) {
            return gettextCatalog.getString(
                'Primary key for address {{email}} cannot be decrypted. You will not be able to read or write any email from this address',
                { email },
                'Error'
            );
        }
    };

    /**
     * Activate newly-provisioned member key
     * @param  {Object} key                    the key object
     * @param  {Object} pkg                    decrypted private key
     * @param  {String} mailboxPassword        the mailbox password
     * @return {Object}
     */
    const activateKey = (key, pkg, mailboxPassword) => {
        return pmcw
            .encryptPrivateKey(pkg, mailboxPassword)
            .then((PrivateKey) => Key.activate(key.ID, { PrivateKey }))
            .then(() => pkg);
    };

    /**
     * Add additional parameters to keys before storing them
     * @param  {Object} key                    the key object
     * @param  {Object} pkg                    decrypted private key
     * @param  {String} address                address corresponding to key
     * @return {Object}
     */
    const storeKey = ({ key, pkg, address }) => {
        key.decrypted = true; // We mark this key as decrypted
        return keyInfo(key).then((key) => ({ address, key, pkg }));
    };

    /**
     * Check whether key decrypts and if not skip
     * @param  {Object} key                    the key object
     * @param  {String} address                address corresponding to key
     * @param  {int} index                     index of key for address (0 = primary key)
     * @return {Object}
     */
    const skipKey = ({ key, address, index }) => {
        key.decrypted = false; // This key is not decrypted
        return keyInfo(key).then((key) => {
            // If the primary (first) key for address does not decrypt, display error.
            if (index === 0) {
                address.disabled = true; // This address cannot be used
                notification.error(I18N.errorPrimaryKey(address));
            }
            return { address, key, pkg: null };
        });
    };

    /**
     * Decrypt a user's keys
     * @param  {Object} user                   the user object
     * @param  {Array} addresses
     * @param  {Object} organizationKey        organization private key
     * @param  {String} mailboxPassword        the user's mailbox password
     * @return {Object} {keys, dirtyAddresses} decrypted keys, addresses without keys
     */
    return async (user = {}, addresses = [], organizationKey = {}, mailboxPassword) => {
        const privateUser = user.Private === 1;
        const subuser = !_.isUndefined(user.OrganizationPrivateKey);

        // All user key are decrypted and stored
        const address = { ID: MAIN_KEY };
        const { Keys = [] } = user;
        const list = Keys.map((key, index) => {
            if (subuser === true) {
                return setupKeys.decryptMemberKey(key, organizationKey).then((pkg) => storeKey({ key, pkg, address }));
            }
            return pmcw
                .decryptPrivateKey(key.PrivateKey, mailboxPassword)
                .then((pkg) => storeKey({ key, pkg, address }), () => skipKey({ key, address, index }));
        });

        const primaryKeys = await Promise.all(list);

        // All address keys are decrypted and stored
        const { promises, dirtyAddresses } = addresses.reduce(
            (acc, address) => {
                if (address.Keys.length) {
                    const promises = address.Keys.map((key, index) => {
                        if (subuser) {
                            return setupKeys
                                .decryptMemberKey(key, organizationKey)
                                .then((pkg) => storeKey({ key, pkg, address }));
                        }
                        if (key.Activation) {
                            return setupKeys
                                .decryptMemberKey(key, primaryKeys[0].pkg)
                                .then((pkg) => activateKey(key, pkg, mailboxPassword))
                                .then((pkg) => storeKey({ key, pkg, address }));
                        }
                        return pmcw
                            .decryptPrivateKey(key.PrivateKey, mailboxPassword)
                            .then((pkg) => storeKey({ key, pkg, address }), () => skipKey({ key, address, index }));
                    });
                    acc.promises = acc.promises.concat(promises);
                }

                if (!address.Keys.length && address.Status === 1 && privateUser === true) {
                    acc.dirtyAddresses.push(address);
                }

                return acc;
            },
            { promises: [], dirtyAddresses: [] }
        );

        return Promise.all(promises).then((addressKeys) => {
            const keys = primaryKeys.concat(addressKeys).filter(({ key }) => key.decrypted);
            return { keys, dirtyAddresses };
        });
    };
}
export default decryptKeys;
