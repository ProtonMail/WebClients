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
    authApi,
    $state,
    setupKeys
) {
    const CACHE = {};
    const { dispatcher } = dispatchers(['signup']);
    const dispatch = (type, data = {}) => dispatcher.signup(type, data);

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
            }

            throw e;
        }
    }

    function setUserLanguage() {
        if ($location.search().language) {
            return settingsApi.updateLocale({ Locale: gettextCatalog.getCurrentLanguage() });
        }
    }

    async function doLogUserIn() {
        dispatch('loguserin', { value: true });
        const credentials = {
            username: signupModel.get('username'),
            password: signupModel.getPassword()
        };
        await authentication.loginWithCookies(credentials);
    }

    async function doAccountSetup() {
        dispatch('setup.account', { value: true });

        const { data } = await Address.setup({ Domain: signupModel.getDomain() });

        CACHE.setupPayload.keys[0].AddressID = data.Address.ID;

        await setupKeys.setup(CACHE.setupPayload, signupModel.getPassword());

        authentication.setPassword(CACHE.setupPayload.mailboxPassword);
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

    const doSubscription = async () => {
        // Attach subscription and catch any error to keep the same behavior as before (to redirect to the inbox).
        await attachSignupSubscription({
            planIds: signupModel.get('temp.planIds'),
            payment: signupModel.get('temp.payment'),
            method: signupModel.get('temp.method')
        }).catch((e) => console.error(e));
    };

    const create = async (model) => {
        await doCreateUser(model);
        await doLogUserIn();
        await doAccountSetup();
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
        create(model).catch(() => {
            dispatch('signup.error', { value: true });
        });
    };

    return { createAccount, generateNewKeys };
}
export default signupUserProcess;
