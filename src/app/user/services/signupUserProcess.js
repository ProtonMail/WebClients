import { UNPAID_STATE, WIZARD_ENABLED } from '../../constants';

/* @ngInject */
function signupUserProcess(
    $location,
    AppModel,
    dispatchers,
    gettextCatalog,
    settingsApi,
    signupModel,
    authentication,
    lazyLoader,
    Address,
    $state,
    setupKeys,
    notification
) {
    const CACHE = {};
    const { dispatcher } = dispatchers(['signup']);
    const dispatch = (type, data = {}) => dispatcher.signup(type, data);

    const I18N = {
        ERROR_ADDRESS_CREATION: gettextCatalog.getString('Something went wrong during address creation', null, 'Error'),
        ERROR_PROCESS: gettextCatalog.getString('Something went wrong', null, 'Error')
    };

    async function doCreateUser(model) {
        dispatch('create.user', { value: true });
        try {
            const { data } = await signupModel.createUser(model);
            return data;
        } catch (e) {
            const { data = {} } = e;
            // Failed Human verification
            if (data.Code === 12087) {
                dispatch('creating', { value: false });
                dispatch('chech.humanity', { value: true });

                return Promise.reject({
                    error: new Error(data.Error),
                    verbose: false
                });
            }

            return Promise.reject({
                error: new Error(e.Error),
                verbose: true
            });
        }
    }

    async function setUserLanguage() {
        if ($location.search().language) {
            return settingsApi.updateLocale({ Locale: gettextCatalog.getCurrentLanguage() });
        }
    }

    function doLogUserIn() {
        dispatch('loguserin', { value: true });

        return authentication
            .loginWithCredentials({
                Username: signupModel.get('username'),
                Password: signupModel.getPassword()
            })
            .then(({ data }) => {
                authentication.receivedCredentials(data);
                return authentication.setAuthCookie(data);
            })
            .then(() => {
                AppModel.set('isLoggedIn', authentication.isLoggedIn());
                AppModel.set('isLocked', authentication.isLocked());
                AppModel.set('isSecure', authentication.isSecured());
            });
    }

    async function doAccountSetup() {
        dispatch('setup.account', { value: true });

        try {
            const { data } = await Address.setup({ Domain: signupModel.getDomain() });

            CACHE.setupPayload.keys[0].AddressID = data.Address.ID;

            return setupKeys.setup(CACHE.setupPayload, signupModel.getPassword()).then(() => {
                authentication.savePassword(CACHE.setupPayload.mailboxPassword);

                AppModel.set('isLoggedIn', authentication.isLoggedIn());
                AppModel.set('isLocked', authentication.isLocked());
                AppModel.set('isSecure', authentication.isSecured());
                return data;
            });
        } catch (err) {
            const { data = {} } = err;
            if (data.Error) {
                throw new Error(data.Error);
            }
            throw err;
        }
    }

    async function doGetUserInfo() {
        dispatch('user.get', { value: true });
        await lazyLoader.app();
        return authentication.fetchUserInfo();
    }

    function finishRedirect() {
        dispatch('user.finish', { value: true });

        delete CACHE.setupPayload;
        if (authentication.user.Delinquent < UNPAID_STATE.DELINQUENT) {
            return $state.go('secured.inbox', { welcome: WIZARD_ENABLED });
        }

        $state.go('secured.dashboard');
    }

    const createAddress = async () => {
        try {
            return await doLogUserIn().then(doAccountSetup);
        } catch (e) {
            const { data = {} } = e;
            if (data.Error) {
                return Promise.reject({
                    error: new Error(data.Error || I18N.ERROR_ADDRESS_CREATION),
                    verbose: true,
                    redirect: 'login'
                });
            }

            throw e;
        }
    };

    const create = async (model) => {
        try {
            await doCreateUser(model);
            await createAddress();

            return setUserLanguage()
                .then(doGetUserInfo)
                .then(finishRedirect);
        } catch (e) {
            throw e;
        }
    };

    function generateNewKeys() {
        dispatch('generate.newkeys', { value: true });
        return setupKeys
            .generate([{ ID: 0, Email: signupModel.getEmail() }], signupModel.getPassword())
            .then((result) => (CACHE.setupPayload = result));
    }

    const createAccount = (model) => {
        create(model).catch((e) => {
            notification.error(e.error ? e.error.message : I18N.ERROR_PROCESS);
            dispatch('signup.error', { value: true });
            console.error(e);
            e.redirect && $state.go(e.redirect);
        });
    };

    return { createAccount, generateNewKeys };
}
export default signupUserProcess;
