import { FREE_USER_ROLE } from '../../constants';

/* @ngInject */
function organizationModel(
    organizationApi,
    organizationKeysModel,
    setupKeys,
    authentication,
    dispatchers,
    gettextCatalog,
    notification,
    networkActivityTracker,
    changeOrganizationPasswordModal,
    loginPasswordModal,
    translator,
    changeOrganizationPassword
) {
    let CACHE = {};

    const I18N = translator(() => ({
        UPDATING_NAME_SUCCESS: gettextCatalog.getString('Organization updated', null, 'Info'),
        UPDATE_PASSWORD_SUCCESS: gettextCatalog.getString('Password updated', null, 'Info')
    }));

    const { dispatcher, on } = dispatchers(['organizationChange']);

    const fakeOrganization = {
        PlanName: 'free',
        MaxMembers: 1,
        HasKeys: 0
    };
    const fakeResult = {
        data: {
            Code: 1000,
            Organization: fakeOrganization
        }
    };

    const clear = () => (CACHE = {});
    const get = (key = 'organization') => CACHE[key];
    const set = (data = {}, key = 'organization') => {
        CACHE[key] = data;
        if (key === 'organization') {
            dispatcher.organizationChange('update', data);
        }
    };

    const isFreePlan = () => (CACHE.organization || {}).PlanName === 'free';

    function fetch() {
        if (authentication.user.Role === FREE_USER_ROLE) {
            set(fakeOrganization);
            return Promise.resolve(fakeResult);
        }
        return organizationApi.get().then(({ data = {} } = {}) => {
            set(data.Organization);
            return data.Organization;
        });
    }

    function create() {
        if (!isFreePlan()) {
            return Promise.resolve();
        }

        generateKeys()
            .then(organizationApi.create)
            .then(({ data = {} } = {}) => data);
    }

    function generateKeys() {
        if (!isFreePlan()) {
            return Promise.resolve();
        }

        return setupKeys
            .generateOrganization(authentication.getPassword())
            .then(({ privateKeyArmored: PrivateKey }) => ({ PrivateKey }));
    }

    const saveName = (DisplayName) => {
        const promise = organizationApi.updateOrganizationName({ DisplayName }).then(({ data = {} } = {}) => {
            notification.success(I18N.UPDATING_NAME_SUCCESS);
            return data;
        });

        networkActivityTracker.track(promise);
    };

    const updatePassword = (newPassword) => {
        const submit = (Password, TwoFactorCode) => {
            const creds = { Password, TwoFactorCode };
            const organizationKey = organizationKeysModel.get('organizationKey');

            const promise = changeOrganizationPassword({ newPassword, creds, organizationKey }).then(() => {
                notification.success(I18N.UPDATE_PASSWORD_SUCCESS);
                loginPasswordModal.deactivate();
            });
            networkActivityTracker.track(promise);
        };

        loginPasswordModal.activate({
            params: {
                submit,
                cancel() {
                    loginPasswordModal.deactivate();
                }
            }
        });
    };

    const changePassword = () => {
        changeOrganizationPasswordModal.activate({
            params: {
                close(newPassword) {
                    changeOrganizationPasswordModal.deactivate();
                    newPassword && updatePassword(newPassword);
                }
            }
        });
    };

    const changeKeys = organizationKeysModel.changeKeys;

    on('logout', () => {
        clear();
    });

    return {
        set,
        get,
        clear,
        isFreePlan,
        fetch,
        create,
        generateKeys,
        saveName,
        changePassword,
        changeKeys
    };
}
export default organizationModel;
