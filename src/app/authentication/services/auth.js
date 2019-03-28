import { decryptPrivateKey } from 'pmcrypto';
import loginWithFallback from 'proton-shared/lib/authentication/loginWithFallback';
import { getAccessToken } from 'proton-shared/lib/authentication/helpers';

/* @ngInject */
function authentication(
    $http,
    $state,
    $injector,
    authApi,
    checkKeysFormat,
    keysModel,
    networkActivityTracker,
    dispatchers,
    authenticationStore,
    secureSessionStorage,
    User,
    compatApi,
    AppModel,
    settingsApi,
    tempStorage,
    upgradeKeys,
    decryptKeys
) {
    const { dispatcher } = dispatchers(['setUser']);

    const getUserInfo = async (userResult) => {
        const user = userResult || (await User.get());

        // Redirect to setup if necessary
        if (user.Keys.length === 0) {
            $state.go('login.setup');
            return user;
        }

        const { OrganizationPrivateKey } = user;

        user.subuser = !!OrganizationPrivateKey;

        if (!user.DisplayName) {
            user.DisplayName = user.Name;
        }

        const mailboxPassword = api.getPassword();

        const [addresses, organizationKey] = await Promise.all([
            $injector.get('addressesModel').fetch(user),
            OrganizationPrivateKey ? decryptPrivateKey(OrganizationPrivateKey, mailboxPassword) : undefined,
            $injector.get('settingsApi').fetch(),
            $injector.get('settingsMailApi').fetch(),
            $injector.get('contactEmails').load()
        ]);

        const { keys } = await decryptKeys({
            user,
            addresses,
            organizationKey,
            mailboxPassword,
            isSubUser: user.subuser
        });

        await keysModel.storeKeys(keys);

        return user;
    };

    const login = async (credentials) => {
        const { result } = await loginWithFallback({ api: compatApi, credentials });
        return result;
    };

    /**
     * Login and set cookies and UID.
     * NOTE: Assumes user is in 1-password mode, which is always true for reset password and signup.
     * TODO: Remove encrypted access token after it's been removed in the API.
     * @param {Object} credentials
     * @returns {Promise}
     */
    const loginWithCookies = async (credentials) => {
        const { UID, AccessToken, RefreshToken, PrivateKey, KeySalt } = await login(credentials);
        const accessToken = await getAccessToken(AccessToken, PrivateKey, KeySalt, credentials.password);
        await authApi.cookies({ UID, AccessToken: accessToken, RefreshToken });
        setUID(UID);
    };

    const fetchUserInfo = async () => {
        try {
            const plainMailboxPass = tempStorage.getItem('plainMailboxPass');
            const userResult = tempStorage.getItem('userResult');

            const user = await networkActivityTracker.track(getUserInfo(userResult));
            api.user = user;
            dispatcher.setUser();

            if (plainMailboxPass && !user.OrganizationPrivateKey && !checkKeysFormat(user)) {
                AppModel.set('upgradingKeys', true);
                await upgradeKeys({
                    mailboxPassword: plainMailboxPass,
                    oldSaltedPassword: api.getPassword(),
                    user
                });
            }

            return user;
        } catch (error) {
            // If initializing the sessions fails from login or from f5 refresh, redirect to login.
            $state.go('login', undefined, { reload: true });
            throw error;
        }
    };

    const setAuthHeaders = (UID) => {
        $http.defaults.headers.common['x-pm-uid'] = UID;
    };

    const { setUID: setUIDAuthStore, getUID, setPassword, getPassword, hasSession } = authenticationStore;

    const setUID = (UID) => {
        setUIDAuthStore(UID);
        setAuthHeaders(UID);
    };

    const initialize = () => {
        const UID = getUID();
        if (!UID) {
            return;
        }
        setAuthHeaders(UID);
    };

    // RUN-TIME PUBLIC FUNCTIONS
    let api = {
        user: {},
        setUID,
        getUID,
        setPassword,
        getPassword,

        detectAuthenticationState: initialize,
        existingSession: hasSession,
        isLoggedIn: hasSession,

        login,
        loginWithCookies,

        hasPaidMail() {
            return this.user.Subscribed & 1;
        },

        hasPaidVpn() {
            return this.user.Subscribed & 4;
        },

        isPrivate() {
            return this.user.Private === 1;
        },

        /**
         * Removes all connection data
         * @param {Boolean} redirect - Redirect at the end the user to the login page
         */
        logout(redirect, callApi = true) {
            const uid = authenticationStore.getUID();
            const process = () => {
                this.clearData();

                if (redirect === true) {
                    $state.go('login');
                }
            };

            AppModel.set('loggingOut', true);

            if (callApi && uid) {
                authApi.revoke().then(process, process);
            } else {
                process();
            }
        },

        clearData() {
            try {
                // Reset $http server
                $http.defaults.headers.common['x-pm-session'] = undefined;
                $http.defaults.headers.common.Authorization = undefined;
                $http.defaults.headers.common['x-pm-uid'] = undefined;
                // Completely clear sessionstorage
                secureSessionStorage.reset();
                tempStorage.clear();
                // Delete data key
                api.loggedIn = false;
                // Remove all user information
                this.user = {};
                // Clean onbeforeunload listener
                window.onbeforeunload = undefined;
                // Disable animation
                AppModel.set('loggingOut', false);
                // Re-initialize variables
                AppModel.set('loggedIn', false);
                AppModel.set('isLoggedIn', false);
                AppModel.set('isSecure', false);
                $injector.get('contactEmails').clear();
            } catch (e) {
                // Do nothing as we lazy load some service it can throw an error
                // -> ex signup
            }
        },

        fetchUserInfo
    };

    return api;
}
export default authentication;
