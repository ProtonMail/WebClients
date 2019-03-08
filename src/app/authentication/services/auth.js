import _ from 'lodash';
import { decodeBase64, decodeUtf8Base64, decryptPrivateKey, checkMailboxPassword, encodeUtf8Base64 } from 'pmcrypto';
import { AUTH_VERSION, computeKeyPassword } from 'pm-srp';

import { OAUTH_KEY, MAILBOX_PASSWORD_KEY } from '../../constants';
import { computeKeyPasswordWithFallback } from '../../../helpers/passwordsHelper';

/* @ngInject */
function authentication(
    $http,
    $log,
    $q,
    $state,
    $injector,
    $exceptionHandler,
    authApi,
    checkKeysFormat,
    keysModel,
    upgradePassword,
    networkActivityTracker,
    dispatchers,
    secureSessionStorage,
    User,
    srp,
    loginWithFallback,
    AppModel,
    tempStorage,
    upgradeKeys,
    decryptKeys
) {
    const { dispatcher } = dispatchers(['setUser']);
    const auth = {
        headersSet: false,
        // The Authorization header is used just once for the /cookies route, then we forget it and use cookies instead.
        setAuthHeaders() {
            this.headersSet = true;
            $http.defaults.headers.common['x-pm-uid'] = auth.data.UID;
            if (auth.data.AccessToken) {
                $http.defaults.headers.common.Authorization = 'Bearer ' + auth.data.AccessToken;
            } else {
                $http.defaults.headers.common.Authorization = undefined;
            }
        },

        fetchUserInfo() {
            const promise = User.get().then((user) => {
                // Redirect to setup if necessary
                if (user.Keys.length === 0) {
                    $state.go('login.setup');
                    return Promise.resolve(user);
                }

                user.subuser = angular.isDefined(user.OrganizationPrivateKey);
                // Required for subuser
                const decryptOrganization = () => {
                    if (user.subuser) {
                        return decryptPrivateKey(user.OrganizationPrivateKey, api.getPassword());
                    }
                    return Promise.resolve();
                };

                return $q
                    .all({
                        settings: $injector.get('settingsApi').fetch(),
                        mailSettings: $injector.get('settingsMailApi').fetch(),
                        contacts: $injector.get('contactEmails').load(),
                        addresses: $injector.get('addressesModel').fetch(user),
                        organizationKey: decryptOrganization()
                    })
                    .then(({ organizationKey, addresses }) => ({ user, organizationKey, addresses }))
                    .then(({ user, organizationKey, addresses }) => {
                        return decryptKeys({
                            user,
                            addresses,
                            organizationKey,
                            mailboxPassword: api.getPassword(),
                            isSubUser: user.subuser
                        })
                            .then(({ keys }) => (keysModel.storeKeys(keys), user))
                            .catch((error) => {
                                $exceptionHandler(error);
                                throw error;
                            });
                    });
            });
            return networkActivityTracker.track(promise);
        }
    };

    function saveAuthData(data) {
        $log.debug('saveAuthData', data);

        secureSessionStorage.setItem(OAUTH_KEY + ':UID', data.UID);
        auth.data = _.pick(data, 'UID', 'AccessToken', 'RefreshToken');

        auth.setAuthHeaders();
    }

    function savePassword(pwd) {
        // Save password in session storage
        secureSessionStorage.setItem(MAILBOX_PASSWORD_KEY, encodeUtf8Base64(pwd));
    }

    function receivedCredentials(data) {
        const eventManager = $injector.get('eventManager');
        saveAuthData(data);
        eventManager.initialize(data.EventID);
    }

    // RUN-TIME PUBLIC FUNCTIONS
    let api = {
        user: {},
        saveAuthData,
        receivedCredentials,
        getUID() {
            return secureSessionStorage.getItem(OAUTH_KEY + ':UID');
        },
        detectAuthenticationState() {
            const uid = secureSessionStorage.getItem(OAUTH_KEY + ':UID');
            const session = secureSessionStorage.getItem(OAUTH_KEY + ':SessionToken');

            if (uid) {
                auth.data = {
                    UID: uid
                };

                auth.setAuthHeaders();
            } else if (session) {
                auth.data = {
                    UID: decodeBase64(session)
                };

                // Remove obsolete item
                secureSessionStorage.setItem(OAUTH_KEY + ':UID', auth.data.UID);
                secureSessionStorage.removeItem(OAUTH_KEY + ':SessionToken');

                auth.setAuthHeaders();
            }
        },

        savePassword(pwd) {
            // Never save mailbox password changes if sub user
            if (this.user && this.user.OrganizationPrivateKey) {
                return;
            }

            // Save password in session storage
            secureSessionStorage.setItem(MAILBOX_PASSWORD_KEY, encodeUtf8Base64(pwd));
        },

        /**
         * Return the mailbox password stored in the session storage
         */
        getPassword() {
            const value = secureSessionStorage.getItem(MAILBOX_PASSWORD_KEY);
            return value ? decodeUtf8Base64(value) : undefined;
        },

        getRefreshCookie(config) {
            $log.debug('getRefreshCookie');
            return authApi.refresh({}, config).then((response) => {
                $log.debug(response);

                // Necessary during the transition to UIDs
                saveAuthData(response.data);

                return response;
            });
        },

        async setAuthCookie(authResponse) {
            $log.debug('setAuthCookie');

            const result = await authApi.cookies({
                RefreshToken: authResponse.RefreshToken,
                UID: authResponse.UID
            });
            AppModel.set('domoArigato', true);
            saveAuthData(result.data);
            AppModel.set('isLocked', false);
            await upgradePassword.send();
        },

        async loginWithCredentials(credentials, authInfo) {
            if (!credentials.Username || !credentials.Password) {
                throw new Error('Username and Password are required to login');
            }

            const { authVersion, result } = await loginWithFallback(credentials, authInfo);

            // Upgrade users to the newest auth version
            if (authVersion < AUTH_VERSION) {
                upgradePassword.store(credentials);
            }

            return result;
        },

        existingSession() {
            if (auth.data && auth.data.UID) {
                return true;
            }

            return false;
        },

        // Whether a user is logged in at all
        isLoggedIn() {
            const loggedIn = this.existingSession();

            if (loggedIn && auth.headersSet === false) {
                auth.setAuthHeaders();
            }

            return loggedIn;
        },

        // Whether the mailbox' password is accessible, or if the user needs to re-enter it
        isLocked() {
            return this.isLoggedIn() === false || angular.isUndefined(this.getPassword());
        },

        hasPaidMail() {
            return this.user.Subscribed & 1;
        },

        hasPaidVpn() {
            return this.user.Subscribed & 4;
        },

        isPrivate() {
            return this.user.Private === 1;
        },

        isSecured() {
            return this.isLoggedIn() && angular.isDefined(this.getPassword());
        },

        // Return a state name to be in in case some user authentication step is required.
        // This will null if the logged in and unlocked.
        state() {
            if (this.isLoggedIn()) {
                return this.isLocked() ? 'login.unlock' : null;
            }
            return 'login';
        },

        // Redirect to a new authentication state, if required
        redirectIfNecessary() {
            const newState = this.state();

            if (newState) {
                $state.go(newState);
            }
        },

        /**
         * Removes all connection data
         * @param {Boolean} redirect - Redirect at the end the user to the login page
         */
        logout(redirect, callApi = true) {
            const uid = secureSessionStorage.getItem(OAUTH_KEY + ':UID');
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
                secureSessionStorage.clear();
                // Delete data key
                delete auth.data;
                auth.headersSet = false;
                // Remove all user information
                this.user = {};
                // Clean onbeforeunload listener
                window.onbeforeunload = undefined;
                // Disable animation
                AppModel.set('loggingOut', false);
                // Re-initialize variables
                AppModel.set('isLoggedIn', this.isLoggedIn());
                AppModel.set('isLocked', this.isLocked());
                AppModel.set('isSecure', this.isSecured());
                AppModel.set('domoArigato', false);
                AppModel.set('loggedIn', false);
                $injector.get('contactEmails').clear();
            } catch (e) {
                // Do nothing as we lazy load some service it can throw an error
                // -> ex signup
            }
        },

        // Returns an async promise that will be successful only if the mailbox password
        // proves correct (we test this by decrypting a small blob)
        async unlockWithPassword(
            pwd,
            {
                PrivateKey = '',
                AccessToken = '',
                RefreshToken = '',
                UID = '',
                ExpiresIn = 0,
                EventID = '',
                KeySalt = ''
            } = {}
        ) {
            if (!pwd) {
                throw new Error('Password is required.');
            }

            const mailboxPassword = await computeKeyPasswordWithFallback(pwd, KeySalt);
            const { token } = await checkMailboxPassword(PrivateKey, mailboxPassword, AccessToken).catch(() => {
                throw new Error('Wrong decryption password');
            });

            tempStorage.setItem('plainMailboxPass', pwd);
            savePassword(mailboxPassword);
            receivedCredentials({
                AccessToken: token,
                RefreshToken,
                UID,
                ExpiresIn,
                EventID
            });
        },

        fetchUserInfo() {
            const promise = auth.fetchUserInfo();

            return promise
                .then((user) => {
                    if (!user.DisplayName) {
                        user.DisplayName = user.Name;
                    }

                    AppModel.set('isLoggedIn', true);
                    this.user = user;
                    dispatcher.setUser();

                    const plainMailboxPass = tempStorage.getItem('plainMailboxPass');
                    tempStorage.removeItem('plainMailboxPass');

                    if (plainMailboxPass && !user.OrganizationPrivateKey) {
                        if (!checkKeysFormat(user)) {
                            AppModel.set('upgradingKeys', true);
                            return upgradeKeys({
                                mailboxPassword: plainMailboxPass,
                                oldSaltedPassword: this.getPassword(),
                                user
                            }).then(() => Promise.resolve(user));
                        }
                    }

                    return user;
                })
                .catch((error) => {
                    $state.go('support.message', { error });
                    throw error;
                });
        },

        params(params) {
            return params;
        }
    };

    return api;
}
export default authentication;
