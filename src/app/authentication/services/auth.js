import { decryptPrivateKey } from 'pmcrypto';
import loginWithFallback from 'proton-shared/lib/authentication/loginWithFallback';
import { getAuthHeaders } from './authApi';
import { destroyOpenpgp, loadOpenpgp } from '../../loadOpenpgp';

/* @ngInject */
function authentication(
    $http,
    $state,
    $injector,
    authApi,
    loggedOutSessions,
    checkKeysFormat,
    keysModel,
    networkActivityTracker,
    dispatchers,
    authenticationStore,
    secureSessionStorage,
    User,
    compatApi,
    AppModel,
    tempStorage,
    upgradeKeys,
    decryptKeys,
    activateKeys
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

        const isSubUser = user.subuser;
        const { keys } = await decryptKeys({
            user,
            addresses,
            organizationKey,
            mailboxPassword,
            isSubUser: user.subuser
        });

        await keysModel.storeKeys(keys);

        if (!isSubUser) {
            await activateKeys(addresses, mailboxPassword);
        }

        return user;
    };

    const login = async (credentials) => {
        const { result } = await loginWithFallback({ api: compatApi, credentials });
        return result;
    };

    /**
     * Login and set cookies and UID.
     * NOTE: Assumes user is in 1-password mode, which is always true for reset password and signup.
     * @param {Object} credentials
     * @returns {Promise}
     */
    const loginWithCookies = async (credentials) => {
        const { UID, AccessToken, RefreshToken } = await login(credentials);
        await authApi.cookies({ UID, AccessToken, RefreshToken }, getAuthHeaders({ UID, AccessToken }));
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
                    plainMailboxPass,
                    oldSaltedPassword: api.getPassword(),
                    user
                }).catch((e) => {
                    console.error(e);
                });
            }

            return user;
        } catch (error) {
            // If initializing the sessions fails from login or from f5 refresh, redirect to login.
            if (error && error.status === 401) {
                $state.go('login', undefined, { reload: true });
            } else {
                // If we are not refreshing from inside. e.g. coming from login or signup. Logout and redirect to login.
                if ($state.current.name.includes('login')) {
                    $state.go('login', undefined, { reload: true });
                } else {
                    $state.go('login.down', undefined, { location: false });
                }
                console.error(error);
            }
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
        setPassword(password) {
            // Never save mailbox password changes if sub user
            if (this.user && this.user.OrganizationPrivateKey) {
                return;
            }
            setPassword(password);
        },
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
            // Race condition when logging in
            if (uid) {
                loggedOutSessions.addUID(uid);
            }

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
                destroyOpenpgp();
                // Ignore the promise from loadOpenpgp since it would be annoying to handle better
                // In the best case it should be fast since it's cached, and it would only have an impact if the user logs in before it's fully loaded.
                loadOpenpgp();
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
