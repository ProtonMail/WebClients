angular.module('proton.user')
    .factory('signupUserProcess', ($location, $rootScope, gettextCatalog, settingsApi, signupModel, authentication, Address, $state, setupKeys, CONSTANTS, notification) => {

        const CACHE = {};
        const dispatch = (type, data = {}) => $rootScope.$emit('signup', { type, data });

        const I18N = {
            ERROR_ADDRESS_CREATION: gettextCatalog.getString('Something went wrong during address creation', null, 'Error'),
            ERROR_PROCESS: gettextCatalog.getString('Something went wrong', null, 'Error')
        };

        async function doCreateUser(model) {
            dispatch('create.user', { value: true });
            const { data } = await signupModel.createUser(model);
            return data;
        }

        async function setUserLanguage() {
            if ($location.search().language) {
                return settingsApi.setLanguage({ Language: gettextCatalog.getCurrentLanguage() });
            }
        }

        function doLogUserIn() {
            dispatch('loguserin', { value: true });

            return authentication.loginWithCredentials({
                Username: signupModel.get('username'),
                Password: signupModel.getPassword()
            })
                .then(({ data }) => {
                    authentication.receivedCredentials(data);
                    return authentication.setAuthCookie(data);
                })
                .then(() => {
                    $rootScope.isLoggedIn = authentication.isLoggedIn();
                    $rootScope.isLocked = authentication.isLocked();
                    $rootScope.isSecure = authentication.isSecured();
                });
        }

        async function doAccountSetup() {

            dispatch('setup.account', { value: true });

            const { data } = await Address.setup({ Domain: signupModel.getDomain() });

            if (data.Code === 1000) {
                CACHE.setupPayload.keys[0].AddressID = data.Address.ID;

                return setupKeys.setup(CACHE.setupPayload, signupModel.getPassword())
                    .then(() => {
                        authentication.savePassword(CACHE.setupPayload.mailboxPassword);

                        $rootScope.isLoggedIn = authentication.isLoggedIn();
                        $rootScope.isLocked = authentication.isLocked();
                        $rootScope.isSecure = authentication.isSecured();
                        return data;
                    });
            }

            return data;
        }

        function doGetUserInfo() {
            dispatch('user.get', { value: true });
            return authentication.fetchUserInfo();
        }

        function finishRedirect() {
            dispatch('user.finish', { value: true });

            delete CACHE.setupPayload;
            if (authentication.user.Delinquent < 3) {
                return $state.go('secured.inbox', { welcome: CONSTANTS.WIZARD_ENABLED });
            }

            $state.go('secured.dashboard');
        }

        const create = async (model) => {

            const userData = await doCreateUser(model);


            // Failed Human verification
            if (userData.Code === 12087) {

                dispatch('creating', { value: false });
                dispatch('chech.humanity', { value: true });

                return Promise.reject({
                    error: new Error(userData.Error),
                    verbose: false
                });
            }

            if (userData.Code !== 1000) {
                return Promise.reject({
                    error: new Error(userData.Error),
                    verbose: true
                });
            }

            const addressData = await doLogUserIn().then(doAccountSetup);

            if (addressData.Code !== 1000) {
                return Promise.reject({
                    error: new Error(addressData.Error || I18N.ERROR_ADDRESS_CREATION),
                    verbose: true,
                    redirect: 'login'
                });
            }

            setUserLanguage()
                .then(doGetUserInfo)
                .then(finishRedirect);
        };

        function generateNewKeys() {
            dispatch('generate.newkeys', { value: true });
            return setupKeys.generate([{ ID: 0, Email: signupModel.getEmail() }], signupModel.getPassword())
                .then((result) => CACHE.setupPayload = result);
        }

        const createAccount = (model) => {
            create(model)
                .catch((e) => {
                    notification.error(e.error ? e.error.message : I18N.ERROR_PROCESS);
                    dispatch('signup.error', { value: true });
                    delete CACHE.setupPayload;

                    e.redirect && $state.go(e.redirect);
                });
        };

        return { createAccount, generateNewKeys };
    });
