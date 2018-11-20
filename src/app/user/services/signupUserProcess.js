import { UNPAID_STATE, WIZARD_ENABLED } from '../../constants';
import { API_CUSTOM_ERROR_CODES } from '../../errors';

/* @ngInject */
function signupUserProcess(
    $location,
    AppModel,
    dispatchers,
    gettextCatalog,
    settingsApi,
    signupModel,
    authentication,
    attachSignupSubscription,
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
            if (data.Code === API_CUSTOM_ERROR_CODES.USER_CREATE_TOKEN_INVALID) {
                dispatch('creating', { value: false });
                dispatch('chech.humanity', { value: true });

                return Promise.reject({
                    error: new Error(data.Error),
                    verbose: false
                });
            }

            return Promise.reject({
                error: new Error(data.Error),
                verbose: true
            });
        }
    }

    function setUserLanguage() {
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

        return $state.go('secured.dashboard');
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

    const doSubscription = async () => {
        const plans = signupModel.get('temp.plans');

        // Attach subscription and catch any error to keep the same behavior as before (to redirect to the inbox).
        await attachSignupSubscription({
            plans: signupModel.get('temp.plans'),
            payment: signupModel.get('temp.payment'),
            method: signupModel.get('temp.method')
        }).catch((e) => console.error(e));

        dispatcher.signup('user.subscription.finished', { plans });
    };

    const create = async (model) => {
        await doCreateUser(model);
        await createAddress();
        await doSubscription();
        await setUserLanguage();
        await doGetUserInfo();

        signupModel.clear();

        return finishRedirect();
    };

    function generateNewKeys() {
        dispatch('generate.newkeys', { value: true });
        return setupKeys
            .generate([{ ID: 0, Email: signupModel.getEmail() }], signupModel.getPassword())
            .then((result) => (CACHE.setupPayload = result));
    }

    const createAccount = (model) => {
        dispatch('signup.error', { value: false });
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
