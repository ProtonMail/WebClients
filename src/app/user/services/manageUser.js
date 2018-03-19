import _ from 'lodash';

/* @ngInject */
function manageUser(
    CONSTANTS,
    pmcw,
    $rootScope,
    addressesModel,
    authentication,
    setupKeys,
    $exceptionHandler,
    addressWithoutKeysManager,
    gettextCatalog,
    notification
) {
    const I18N = {
        REVOKE_ADMIN_RELOAD: gettextCatalog.getString('Your admin privileges have been revoked.', null, 'Info'),
        REVOKE_ADMIN_RELOAD_INFO: gettextCatalog.getString('The app will now be reloaded in a few seconds', null, 'Info')
    };

    let previousRole;

    const getPromise = async ({ OrganizationPrivateKey } = {}, password) => {
        if (OrganizationPrivateKey) {
            return pmcw.decryptPrivateKey(OrganizationPrivateKey, password);
        }
    };

    const storeKeys = (keys) => {
        authentication.clearKeys();
        _.each(keys, ({ address, key, pkg }) => {
            authentication.storeKey(address.ID, key.ID, pkg);
        });
    };

    /**
     * Upgrade addesses for a user based on what's coming from
     *     - Event User
     *     - SetupKeys output
     * @param  {Object} user
     * @param  {Array} keys
     * @param  {Array} dirtyAddresses  Addresses without keys
     * @return {void}
     */
    const upgradeAddresses = (user, keys = [], dirtyAddresses = []) => {
        // Use what's coming from setupKeys (:warning: some key are duplicated)
        const { list } = keys.reduce(
            (acc, { address }) => {
                // First item comming from setupKeys is empty
                if (address.ID !== CONSTANTS.MAIN_KEY && !acc.map[address.ID]) {
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

        addressesModel.set(addresses);
    };

    const mergeUser = (user = {}, keys, dirtyAddresses) => {
        _.each(Object.keys(user), (key) => {
            if (key !== 'Addresses') {
                authentication.user[key] = user[key];
            }
        });

        upgradeAddresses(user, keys, dirtyAddresses);
        _.extend($rootScope.user, authentication.user);
        $rootScope.$broadcast('updateUser');
    };

    const generateKeys = (user, Members, keys) => {
        return addressWithoutKeysManager.manage(user, _.map(Members, 'Member'), true).then(
            (addresses = []) => {
                if (addresses.length) {
                    throw new Error('Regenerate keys for addresses');
                }
            },
            () => storeKeys(keys)
        );
    };

    async function manageUser({ User = {}, Members = [] }) {
        // Init value on load
        if (angular.isUndefined(previousRole)) {
            previousRole = authentication.user.Role;
        }

        if (angular.isUndefined(User.Role)) {
            return;
        }

        if (User.Role === CONSTANTS.FREE_USER_ROLE) {
            // Necessary because there is no deletion event for organizations
            $rootScope.$emit('organizationChange', { data: { PlanName: 'free', HasKeys: 0 } });
        }

        // Revoke admin, we reload the app to clear the context
        if (previousRole === CONSTANTS.PAID_ADMIN_ROLE && User.Role !== CONSTANTS.PAID_ADMIN_ROLE) {
            previousRole = User.Role;
            _rAF(() => notification.info(`${I18N.REVOKE_ADMIN_RELOAD}<br>${I18N.REVOKE_ADMIN_RELOAD_INFO}`));
            return _.delay(() => window.location.reload(), 5000);
        }

        previousRole = User.Role;
        const password = authentication.getPassword();

        try {
            const organizationKey = await getPromise(User, password);
            const { dirtyAddresses, keys } = await setupKeys.decryptUser(User, addressesModel.get(), organizationKey, password);
            await generateKeys(User, Members, keys);
            storeKeys(keys);
            mergeUser(User, keys, dirtyAddresses);
        } catch (e) {
            e && $exceptionHandler(e);
        }
    }

    return manageUser;
}
export default manageUser;
