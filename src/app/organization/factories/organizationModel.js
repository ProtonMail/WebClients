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
    changeOrganizationPassword
) {
    let CACHE = {};

    const I18N = {
        CREATE_ERROR: gettextCatalog.getString(
            'Error during organization request',
            null,
            'Error organization creation'
        ),
        FETCH_ERROR: gettextCatalog.getString('Organization request failed', null, 'Error organization'),
        KEYS_ERROR: gettextCatalog.getString(
            'Error during the generation of new organization keys',
            null,
            'Error organization'
        ),
        UPDATING_NAME_ERROR: gettextCatalog.getString('Error updating organization name', null, 'Error'),
        UPDATING_NAME_SUCCESS: gettextCatalog.getString('Organization updated', null, 'Info'),
        UPDATE_PASSWORD_SUCCESS: gettextCatalog.getString('Password updated', null, 'Info')
    };

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
            dispatcher.organizationChange('', data);
        }
    };

    const isFreePlan = () => (CACHE.organization || {}).PlanName === 'free';

    function fetch() {
        if (authentication.user.Role === FREE_USER_ROLE) {
            set(fakeOrganization);
            return Promise.resolve(fakeResult);
        }
        return organizationApi
            .get()
            .then(({ data = {} } = {}) => {
                set(data.Organization);
                return data.Organization;
            })
            .catch(({ data = {} } = {}) => {
                throw new Error(data.Error || I18N.FETCH_ERROR);
            });
    }

    function create() {
        if (!isFreePlan()) {
            return Promise.resolve();
        }

        generateKeys()
            .then(organizationApi.create)
            .then(({ data = {} } = {}) => data)
            .catch(({ data = {} } = {}) => {
                throw new Error(data.Error || I18N.CREATE_ERROR);
            });
    }

    function generateKeys() {
        if (!isFreePlan()) {
            return Promise.resolve();
        }

        return setupKeys
            .generateOrganization(authentication.getPassword())
            .then(({ privateKeyArmored: PrivateKey }) => ({ PrivateKey }))
            .catch(() => {
                throw new Error(I18N.KEYS_ERROR);
            });
    }

    const saveName = (DisplayName) => {
        const promise = organizationApi
            .updateOrganizationName({ DisplayName })
            .then(({ data = {} } = {}) => {
                notification.success(I18N.UPDATING_NAME_SUCCESS);
                return data;
            })
            .catch(({ data = {} } = {}) => {
                throw new Error(data.Error || I18N.UPDATING_NAME_ERROR);
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
