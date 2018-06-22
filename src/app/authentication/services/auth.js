import _ from 'lodash';

import { OAUTH_KEY, FREE_USER_ROLE, MAILBOX_PASSWORD_KEY } from '../../constants';

/* @ngInject */
function authentication(
    $http,
    $location,
    $log,
    $q,
    $rootScope,
    $state,
    $injector,
    $exceptionHandler,
    authApi,
    checkKeysFormat,
    CONFIG,
    errorReporter,
    gettextCatalog,
    upgradePassword,
    Key,
    networkActivityTracker,
    pmcw,
    secureSessionStorage,
    User,
    passwords,
    srp,
    setupKeys,
    AppModel,
    tempStorage,
    sanitize,
    upgradeKeys,
    decryptUser
) {
    let keys = {}; // Store decrypted keys
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
                        return pmcw.decryptPrivateKey(user.OrganizationPrivateKey, api.getPassword());
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
                        const storeKeys = (keys) => {
                            api.clearKeys();
                            _.each(keys, ({ address, key, pkg }) => {
                                api.storeKey(address.ID, key.ID, pkg);
                            });
                        };

                        return decryptUser(user, addresses, organizationKey, api.getPassword())
                            .then(({ keys }) => (storeKeys(keys), user))
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
        secureSessionStorage.setItem(MAILBOX_PASSWORD_KEY, pmcw.encode_utf8_base64(pwd));
    }

    function receivedCredentials(data) {
        const eventManager = $injector.get('eventManager');
        saveAuthData(data);
        eventManager.setEventID(data.EventID);
    }

    // RUN-TIME PUBLIC FUNCTIONS
    let api = {
        user: {},
        saveAuthData,
        savePassword,
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
                    UID: pmcw.decode_base64(session)
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
            secureSessionStorage.setItem(MAILBOX_PASSWORD_KEY, pmcw.encode_utf8_base64(pwd));
        },

        /**
         * Return the mailbox password stored in the session storage
         */
        getPassword() {
            const value = secureSessionStorage.getItem(MAILBOX_PASSWORD_KEY);
            return value ? pmcw.decode_utf8_base64(value) : undefined;
        },

        randomString(length) {
            const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let i;
            let result = '';
            const isOpera = Object.prototype.toString.call(window.opera) === '[object Opera]';

            if (window.crypto && window.crypto.getRandomValues) {
                const values = new Uint32Array(length);
                window.crypto.getRandomValues(values);

                for (i = 0; i < length; i++) {
                    result += charset[values[i] % charset.length];
                }

                return result;
            } else if (isOpera) {
                // Opera's Math.random is secure, see http://lists.w3.org/Archives/Public/public-webcrypto/2013Jan/0063.html
                for (i = 0; i < length; i++) {
                    result += charset[Math.floor(Math.random() * charset.length)];
                }

                return result;
            }
            return this.semiRandomString(length);
        },

        semiRandomString(size) {
            let string = '';
            let i = 0;
            const chars = '0123456789ABCDEF';

            while (i++ < size) {
                string += chars[Math.floor(Math.random() * 16)];
            }

            return string;
        },

        /**
         * Return the private keys available for a specific address ID
         * @param {String} addressID
         * @return {Array}
         */
        getPrivateKeys(addressID) {
            return keys[addressID];
        },

        /**
         * Return the activated public keys available for a specific address ID
         * @param {String} addressID
         * @return {Array}
         */
        getPublicKeys(addressID) {
            return keys[addressID].map((key) => key.toPublic());
        },

        /**
         * Store package
         */
        storeKey(addressID, keyID, pkg) {
            pkg.ID = keyID; // Add the keyID inside the package
            keys[addressID] = keys[addressID] || []; // Initialize array for the address
            keys[addressID].push(pkg); // Add key package
        },

        /**
         * Clear stored keys
         */
        clearKeys() {
            keys = {};
        },

        getRefreshCookie() {
            $log.debug('getRefreshCookie');
            return authApi.refresh({}).then((response) => {
                $log.debug(response);

                // Necessary during the transition to UIDs
                saveAuthData(response.data);

                return response;
            });
        },

        setAuthCookie(authResponse) {
            $log.debug('setAuthCookie');

            return authApi
                .cookies({
                    ResponseType: 'token',
                    ClientID: CONFIG.clientID,
                    GrantType: 'refresh_token',
                    RefreshToken: authResponse.RefreshToken,
                    Uid: authResponse.UID,
                    RedirectURI: 'https://protonmail.com',
                    State: this.randomString(24)
                })
                .then((result) => {
                    $log.debug(result);
                    $log.debug('/auth/cookies:', result);
                    $log.debug('/auth/cookies1: resolved');
                    AppModel.set('domoArigato', true);
                    // forget the old headers, set the new ones
                    $log.debug('/auth/cookies2: resolved');
                    $log.debug('headers change', $http.defaults.headers);

                    saveAuthData(result.data);
                    $rootScope.isLocked = false;

                    return result;
                })
                .catch((error) => {
                    const { data = {} } = error;
                    $log.error('setAuthCookie2', error);
                    // Report issue to Sentry
                    $exceptionHandler(data.Error || error); // NOTE: remove this line once the "Invalid access token" issue is solved
                    throw new Error(data.Error || 'Error setting authentication cookies.');
                });
        },

        loginWithCredentials(creds, initialInfoResponse) {
            const deferred = $q.defer();

            if (!creds.Username || !creds.Password) {
                deferred.reject({
                    message: 'Username and Password are required to login'
                });
            } else {
                delete $http.defaults.headers.common.Accept;
                srp.performSRPRequest(
                    'POST',
                    '/auth',
                    {
                        Username: creds.Username,
                        ClientID: CONFIG.clientID,
                        ClientSecret: CONFIG.clientSecret
                    },
                    creds,
                    initialInfoResponse
                ).then(
                    (resp) => {
                        // Upgrade users to the newest auth version
                        if (resp.authVersion < passwords.currentAuthVersion) {
                            srp.getPasswordParams(creds.Password).then((data) => {
                                upgradePassword.store(data);
                                deferred.resolve(resp);
                            });
                        } else {
                            deferred.resolve(resp);
                        }
                        // this is a trick! we dont know if we should go to unlock or step2 because we dont have user's data yet. so we redirect to the login page (current page), and this is determined in the resolve: promise on that state in the route. this is because we dont want to do another fetch info here.
                    },
                    (error) => {
                        // TODO: This is almost certainly broken, not sure it needs to work though?
                        console.error(error);
                        deferred.reject({
                            message: error.error_description
                        });
                    }
                );
            }

            return deferred.promise;
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

            $rootScope.loggingOut = true;

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
                // Clean keys
                keys = {};
                auth.headersSet = false;
                // Remove all user information
                this.user = {};
                // Clean onbeforeunload listener
                window.onbeforeunload = undefined;
                // Disable animation
                $rootScope.loggingOut = false;
                // Re-initialize variables
                $rootScope.isLoggedIn = this.isLoggedIn();
                $rootScope.isLocked = this.isLocked();
                $rootScope.isSecure = this.isSecured();
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
        unlockWithPassword(
            pwd,
            {
                PrivateKey = '',
                AccessToken = '',
                RefreshToken = '',
                Uid = '',
                ExpiresIn = 0,
                EventID = '',
                KeySalt = ''
            } = {}
        ) {
            const req = $q.defer();
            if (pwd) {
                tempStorage.setItem('plainMailboxPass', pwd);
                passwords
                    .computeKeyPassword(pwd, KeySalt)
                    .then((pwd) => pmcw.checkMailboxPassword(PrivateKey, pwd, AccessToken))
                    .then(
                        ({ token, password }) => {
                            savePassword(password);
                            receivedCredentials({
                                AccessToken: token,
                                RefreshToken,
                                UID: Uid,
                                ExpiresIn,
                                EventID
                            });
                            upgradePassword.send();
                            req.resolve(200);
                        },
                        () => {
                            req.reject({
                                message: 'Wrong decryption password.'
                            });
                        }
                    );
            } else {
                req.reject({
                    message: 'Password is required.'
                });
            }

            return req.promise;
        },

        fetchUserInfo() {
            const promise = auth.fetchUserInfo();

            return promise
                .then((user) => {
                    if (!user.DisplayName) {
                        user.DisplayName = user.Name;
                    }

                    $rootScope.isLoggedIn = true;
                    this.user = user;
                    $rootScope.user = user;

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
                    $state.go('support.message');
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
