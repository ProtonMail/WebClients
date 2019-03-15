import _ from 'lodash';
import { decryptPrivateKey } from 'pmcrypto';

import { MAIN_KEY, FREE_USER_ROLE, PAID_ADMIN_ROLE } from '../../constants';

/* @ngInject */
function manageUser(
    $exceptionHandler,
    addressesModel,
    keysModel,
    addressWithoutKeysManager,
    authentication,
    dispatchers,
    gettextCatalog,
    notification,
    decryptKeys,
    translator
) {
    const { dispatcher, on } = dispatchers(['organizationChange', 'updateUser']);
    const I18N = translator(() => ({
        REVOKE_ADMIN_RELOAD: gettextCatalog.getString('Your admin privileges have been revoked.', null, 'Info'),
        REVOKE_ADMIN_RELOAD_INFO: gettextCatalog.getString(
            'The app will now be reloaded in a few seconds',
            null,
            'Info'
        )
    }));

    const CACHE = {};
    const getPromise = async ({ OrganizationPrivateKey } = {}, password) => {
        if (OrganizationPrivateKey) {
            return decryptPrivateKey(OrganizationPrivateKey, password);
        }
    };

    /**
     * Upgrade addesses for a user based on what's coming from
     *     - Event User
     *     - SetupKeys output
     * @param  {Object} user
     * @param  {Array} keys
     * @param  {Array} dirtyAddresses  Addresses without keys
     * @return {Promise}
     */
    const upgradeAddresses = (user, keys = [], dirtyAddresses = []) => {
        // Use what's coming from setupKeys (:warning: some key are duplicated)
        const { list } = keys.reduce(
            (acc, { address }) => {
                // First item comming from setupKeys is empty
                if (address.ID !== MAIN_KEY && !acc.map[address.ID]) {
                    acc.map[address.ID] = true;
                    acc.list.push(address);
                }
                return acc;
            },
            { map: Object.create(null), list: [] }
        );

        const addresses = list.concat(dirtyAddresses);
        let index = addresses.length;

        while (index--) {
            const address = addresses[index];
            const found = addressesModel.getByID(address.ID, user, true);

            if (angular.isUndefined(found)) {
                addresses.splice(index, 1);
            }
        }

        return addressesModel.set(addresses, user, true);
    };

    const mergeUser = async (user = {}, keys, dirtyAddresses) => {
        // Extend the user Object store in authentication
        _.each(Object.keys(user), (key) => {
            authentication.user[key] = user[key];
        });

        await upgradeAddresses(user, keys, dirtyAddresses);
        dispatcher.updateUser();
    };

    const generateKeys = (user, Members, keys) => {
        return addressWithoutKeysManager.manage(user, _.map(Members, 'Member'), true).then(
            (addresses = []) => {
                // contains the list of address where keys are missing
                if (addresses.length) {
                    // Regenerate keys for addresses
                    return true;
                }
            },
            () => keysModel.storeKeys(keys) // Happens if the user press CANCEL to generate missing keys
        );
    };

    /**
     * Manage user role
     * @param {Integer} user.Role
     * @return {Boolean|void} Returns true if we have to reload the page
     */
    const manageRole = ({ Role } = {}) => {
        // Init value on load
        if (angular.isUndefined(CACHE.previousRole)) {
            CACHE.previousRole = authentication.user.Role;
        }

        if (Role === FREE_USER_ROLE) {
            // Necessary because there is no deletion event for organizations
            dispatcher.organizationChange('update', { data: { PlanName: 'free', HasKeys: 0 } });
        }

        // Revoke admin, we reload the app to clear the context
        if (angular.isDefined(Role) && CACHE.previousRole === PAID_ADMIN_ROLE && Role !== PAID_ADMIN_ROLE) {
            CACHE.previousRole = Role;
            _rAF(() => notification.info(`${I18N.REVOKE_ADMIN_RELOAD}<br>${I18N.REVOKE_ADMIN_RELOAD_INFO}`));
            _.delay(() => window.location.reload(), 5000);
            return true;
        }

        if (angular.isDefined(Role)) {
            CACHE.previousRole = Role;
        }
    };

    async function main({ User = {}, Addresses = [], Members = [] } = {}) {
        if (!Object.keys(User).length && !Addresses.length) {
            return;
        }

        // Remove useless keys
        delete User.Addresses;
        delete User.MailSettings;

        if (manageRole(User)) {
            // Break the process to reload the page
            return;
        }

        try {
            const mailboxPassword = authentication.getPassword();
            // User can be undefined when we update Addresses, that's why we `authentication.user`
            const isSubUser = authentication.user.subuser;
            const organizationKey = await getPromise(User, mailboxPassword);
            const { dirtyAddresses, keys } = await decryptKeys({
                user: User,
                addresses: addressesModel.get(),
                organizationKey,
                mailboxPassword,
                isSubUser
            });

            // Open the generate modal if we find addresses without a key
            if (await generateKeys(User, Members, keys)) {
                // Break the process because the generate keys modal will save them later
                return;
            }

            // Clear all addresses if change on it (so we keep contact keys)
            if (Addresses.length) {
                keysModel.clearAddressKeys();
            }

            keysModel.storeKeys(keys);
            mergeUser(User, keys, dirtyAddresses);
        } catch (e) {
            e && $exceptionHandler(e);
        }
    }

    on('logout', () => {
        delete CACHE.previousRole;
    });

    return main;
}
export default manageUser;
