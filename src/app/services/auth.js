angular.module('proton.authentication', [
    'proton.pmcw',
    'proton.models',
    'proton.storage',
    'proton.passwords',
    'proton.srp'
])

.factory('authentication', (
    $http,
    $location,
    $log,
    $q,
    $rootScope,
    $state,
    $timeout,
    $injector,
    CONFIG,
    CONSTANTS,
    Contact,
    Domain,
    errorReporter,
    generateModal,
    gettextCatalog,
    Label,
    networkActivityTracker,
    notify,
    pmcw,
    secureSessionStorage,
    url,
    User,
    passwords,
    srp
) => {
    let keys = {}; // Store decrypted keys
    /**
     * Clean contact datas received from the BE
     * @param  {Array} contacts
     * @return {Array}
     */
    function cleanContacts(contacts = []) {
        return contacts.map((contact) => {
            contact.Name = DOMPurify.sanitize(contact.Name);
            contact.Email = DOMPurify.sanitize(contact.Email);
            return contact;
        });
    }
    const auth = {
        headersSet: false,
        // These headers are used just once for the /cookies route, then we forget them and use cookies and x-pm-session header instead.
        setAuthHeaders() {
            this.headersSet = true;
            // API version
            if (auth.data.SessionToken) {
                // we have a session token, so we can remove the old stuff
                $http.defaults.headers.common['x-pm-session'] = auth.data.SessionToken;
                $http.defaults.headers.common.Authorization = undefined;
                $http.defaults.headers.common['x-pm-uid'] = undefined;
                secureSessionStorage.removeItem(CONSTANTS.OAUTH_KEY + ':AccessToken');
                secureSessionStorage.removeItem(CONSTANTS.OAUTH_KEY + ':Uid');
                secureSessionStorage.removeItem(CONSTANTS.OAUTH_KEY + ':RefreshToken');
            } else {
                // we need the old stuff for now
                $http.defaults.headers.common['x-pm-session'] = undefined;
                $http.defaults.headers.common.Authorization = 'Bearer ' + auth.data.AccessToken;
                $http.defaults.headers.common['x-pm-uid'] = auth.data.Uid;
            }
        },

        fetchUserInfo() {

            return networkActivityTracker.track(User.get()
            .then((result) => {
                if (result.data && result.data.Code === 1000) {
                    return result.data.User;
                } else if (angular.isDefined(result.data) && result.data.Error) {
                    return Promise.reject({ message: result.data.Error });
                } else {
                    return Promise.reject({ message: 'Error during user request' });
                }
            })
            .then((user) => {

                // Redirect to setup if necessary
                if (user.Keys.length === 0) {
                    $state.go('login.setup');
                    return Promise.resolve(user);
                }

                const subuser = angular.isDefined(user.OrganizationPrivateKey);
                // Required for subuser
                const decryptOrganization = function () {
                    if (subuser === true) {
                        return pmcw.decryptPrivateKey(user.OrganizationPrivateKey, api.getPassword());
                    } else {
                        return Promise.resolve();
                    }
                };

                // Hacky fix for missing organizations
                const fixOrganization = function () {
                    if (user.Role === 0 && user.Subscribed === 1) {
                        return pmcw.generateKeysRSA('pm_org_admin', api.getPassword())
                        .then((response) => {
                            const privateKey = response.privateKeyArmored;

                            return {
                                DisplayName: 'My Organization',
                                PrivateKey: privateKey,
                                BackupPrivateKey: privateKey
                            };
                        })
                        .then((params) => {
                            return $http.post(url.get() + '/organizations', params);
                        });
                    } else {
                        return Promise.resolve();
                    }
                };

                return $q.all({
                    contacts: Contact.query(),
                    labels: Label.query(),
                    fix: fixOrganization(),
                    organizationKey: decryptOrganization()
                })
                .then(({ contacts, labels, organizationKey }) => {
                    if (contacts.data && contacts.data.Code === 1000 && labels.data && labels.data.Code === 1000) {
                        user.Contacts = cleanContacts(contacts.data.Contacts);
                        user.Labels = labels.data.Labels;

                        return { user, organizationKey };
                    } else if (contacts.data && contacts.data.Error) {
                        return Promise.reject({ message: contacts.data.Error });
                    } else if (labels.data && labels.data.Error) {
                        return Promise.reject({ message: labels.data.Error });
                    } else {
                        return Promise.reject({ message: 'Error during label / contact request' });
                    }
                })
                .then(({ user, organizationKey }) => {
                    const promises = [];
                    const dirtyAddresses = [];
                    const privateUser = user.Private === 1;
                    const keyInfo = function (key) {
                        return pmcw.keyInfo(key.PrivateKey).then((info) => {
                            key.created = info.created; // Creation date
                            key.bitSize = info.bitSize; // We don't use this data currently
                            key.fingerprint = info.fingerprint; // Fingerprint
                        });
                    };

                    const decryptToken = function (token) {
                        return pmcw.decryptMessage(token, result.organizationKey);
                    };

                    const decryptKey = ({ key, password, address, index }) => {
                        return pmcw.decryptPrivateKey(key.PrivateKey, password).then((pkg) => { // Decrypt private key with the password
                            key.decrypted = true; // We mark this key as decrypted
                            api.storeKey(address.ID, key.ID, pkg); // We store the package to the current service
                            return keyInfo(key);
                        }, (error) => {
                            key.decrypted = false; // This key is not decrypted
                            // If the primary (first) key for address does not decrypt, display error.
                            if (index === 0) {
                                address.disabled = true; // This address cannot be used
                                notify({ message: 'Primary key for address ' + address.Email + ' cannot be decrypted. You will not be able to read or write any email from this address', classes: 'notification-danger' });
                            }
                            return keyInfo(key);
                        });
                    };

                    const generateKeys = function () {
                        const deferred = $q.defer();

                        generateModal.activate({
                            params: {
                                title: gettextCatalog.getString('Setting up your Addresses', null, 'Title'),
                                message: gettextCatalog.getString('Before you can start sending and receiving emails from your new addresses you need to create encryption keys for them. Simply select your preferred encryption strength and click "Generate Keys".', null, 'Info'),
                                password: api.getPassword(),
                                addresses: dirtyAddresses,
                                close(success, addresses) {
                                    if (success) {
                                        // FIXME this doesn't decrypt or store keys!!!
                                        // Can't call the event service because it might not be started
                                        // Stupid fix
                                        location.reload();
                                        user.Addresses.forEach((address) => {
                                            const found = _.findWhere(addresses, { ID: address.ID });

                                            if (angular.isDefined(found)) {
                                                address = found;
                                            }
                                        });
                                        deferred.resolve();
                                    } else {
                                        deferred.reject();
                                    }

                                    generateModal.deactivate();

                                }
                            }
                        });

                        return deferred.promise;
                    };

                    // All keys are decrypted and stored
                    _.each(user.Keys, (key, index) => {
                        const address = { ID: CONSTANTS.MAIN_KEY };
                        const promise = decryptKey({ key, password: api.getPassword(), address, index })

                        promises.push(promise);
                    });

                    // All private keys are decrypted and stored in a `keys` array
                    _.each(user.Addresses, (address) => {
                        if (address.Keys.length > 0) {
                            let index = 0;
                            _.each(address.Keys, (key) => {
                                if (subuser === true) {
                                    promises.push(decryptToken(key.Token, result.organizationKey).then((token) => { return decryptKey(key, token); }));
                                } else {
                                    promises.push(decryptKey({ key, password: api.getPassword(), address, index }));
                                }
                                index++;
                            });
                        } else if (address.Status === 1 && privateUser === true) {
                            dirtyAddresses.push(address);
                        }
                    });

                    if (dirtyAddresses.length > 0) {
                        promises.push(generateKeys());
                    }

                    return $q.all(promises).then(() => user, () => user);
                });
            })
            .catch((err) => {
                api.logout(true);
                return Promise.reject(err);
            }));
        }
    };

    function saveAuthData(data) {
        if (data.SessionToken) {
            secureSessionStorage.setItem(CONSTANTS.OAUTH_KEY + ':SessionToken', pmcw.encode_base64(data.SessionToken));
            auth.data = data;
        } else {
            secureSessionStorage.setItem(CONSTANTS.OAUTH_KEY + ':Uid', data.Uid);
            secureSessionStorage.setItem(CONSTANTS.OAUTH_KEY + ':AccessToken', data.AccessToken);
            secureSessionStorage.setItem(CONSTANTS.OAUTH_KEY + ':RefreshToken', data.RefreshToken);
            auth.data = _.pick(data, 'Uid', 'AccessToken', 'RefreshToken');
        }

        auth.setAuthHeaders();
    }

    function savePassword(pwd) {
        // Save password in session storage
        secureSessionStorage.setItem(CONSTANTS.MAILBOX_PASSWORD_KEY, pmcw.encode_utf8_base64(pwd));
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
        detectAuthenticationState() {
            const session = secureSessionStorage.getItem(CONSTANTS.OAUTH_KEY + ':SessionToken');

            if (session) {
                auth.data = {
                    SessionToken: pmcw.decode_base64(session)
                };

                // If session token set, we probably have a refresh token, try to refresh
                $rootScope.doRefresh = true;
            }
        },


        /**
         * Return the mailbox password stored in the session storage
         */
        getPassword() {
            const value = secureSessionStorage.getItem(CONSTANTS.MAILBOX_PASSWORD_KEY);
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
            } else if (isOpera) { // Opera's Math.random is secure, see http://lists.w3.org/Archives/Public/public-webcrypto/2013Jan/0063.html
                for (i = 0; i < length; i++) {
                    result += charset[Math.floor(Math.random() * charset.length)];
                }

                return result;
            } else {
                return this.semiRandomString(length);
            }
        },

        semiRandomString(size) {
            let string = '',
                i = 0,
                chars = '0123456789ABCDEF';

            while (i++ < size) {
                string += chars[Math.floor(Math.random() * 16)];
            }

            return string;
        },

        getPrivateKey() {
            const pw = pmcw.decode_utf8_base64(secureSessionStorage.getItem(CONSTANTS.MAILBOX_PASSWORD_KEY));

            return pmcw.decryptPrivateKey(this.user.EncPrivateKey, pw).catch((err) => {
                $log.error(this.user.EncPrivateKey);
                throw err;
            });
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
         * Store package
         */
        storeKey(addressID, keyID, pkg) {
            pkg.ID = keyID; // Add the keyID inside the package
            keys[addressID] = keys[addressID] || []; // Initialize array for the address
            keys[addressID].push(pkg); // Add key package
        },

        getRefreshCookie() {
            $log.debug('getRefreshCookie');
            return $http.post(url.get() + '/auth/refresh', {}).then(
                (response) => {
                    $log.debug(response);
                    if (response.data.SessionToken !== undefined) {
                        $log.debug('new token', response.data.SessionToken);
                        $log.debug('before', $http.defaults.headers.common['x-pm-session']);
                        $http.defaults.headers.common['x-pm-session'] = response.data.SessionToken;
                        secureSessionStorage.setItem(CONSTANTS.OAUTH_KEY + ':SessionToken', pmcw.encode_base64(response.data.SessionToken));
                        $log.debug('after', $http.defaults.headers.common['x-pm-session']);
                        $rootScope.doRefresh = true;
                    }
                    else {
                        return $q.reject(response.data.Error);
                    }
                },
                (err) => {
                    $log.error(err);
                }
            );
        },

        setAuthCookie(authResponse) {
            const deferred = $q.defer();

            $log.debug('setAuthCookie');

            $http.post(url.get() + '/auth/cookies', {
                ResponseType: 'token',
                ClientID: CONFIG.clientID,
                GrantType: 'refresh_token',
                RefreshToken: authResponse.RefreshToken,
                RedirectURI: 'https://protonmail.com',
                State: this.randomString(24)
            })
            .then(
                (result) => {
                    $log.debug(result);

                    if (result.data.Code === 1000) {
                        $log.debug('/auth/cookies:', result);
                        $log.debug('/auth/cookies1: resolved');
                        $rootScope.domoArigato = true;
                        // forget the old headers, set the new ones
                        $log.debug('/auth/cookies2: resolved');
                        deferred.resolve(200);
                        $log.debug('headers change', $http.defaults.headers);

                        const data = {
                            SessionToken: result.data.SessionToken
                        };

                        saveAuthData(data);

                        $rootScope.isLocked = false;
                        $rootScope.doRefresh = true;

                    } else {
                        deferred.reject({ message: result.data.Error });
                        $log.error('setAuthCookie1', result);
                    }
                },
                (error) => {
                    $log.error('setAuthCookie2', error);

                    if (error.data && error.data.Error) {
                        deferred.reject({ message: error.data.Error });
                    } else {
                        deferred.reject({ message: 'Error setting authentication cookies.' });
                    }
                }
            );

            return deferred.promise;
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
                ).then((resp) => {
                    deferred.resolve(resp);
                    // Upgrade users to the newest auth version
                    if (resp.authVersion < passwords.currentAuthVersion) {
                        srp.getPasswordParams(creds.Password)
                            .then((data) => {
                                const headers = {
                                    Authorization: `Bearer ${resp.data.ResetToken}`,
                                    'x-pm-uid': resp.data.Uid
                                };
                                return srp.performSRPRequest('PUT', '/settings/password/upgrade', data, creds, undefined, headers);
                            });
                    }
                    // this is a trick! we dont know if we should go to unlock or step2 because we dont have user's data yet. so we redirect to the login page (current page), and this is determined in the resolve: promise on that state in the route. this is because we dont want to do another fetch info here.
                }, (error) => {
                    // TODO: This is almost certainly broken, not sure it needs to work though?
                    console.log(error);
                    deferred.reject({
                        message: error.error_description
                    });
                });
            }

            return deferred.promise;
        },

        sessionTokenIsDefined() {
            let isDefined = false;

            if (auth.data && typeof auth.data.SessionToken !== 'undefined' && auth.data.SessionToken !== 'undefined') {
                isDefined = true;
            }

            return isDefined;
        },

        // Whether a user is logged in at all
        isLoggedIn() {
            const loggedIn = this.sessionTokenIsDefined();

            if (loggedIn === true && auth.headersSet === false) {
                auth.setAuthHeaders();
            }

            return loggedIn;
        },

        // Whether the mailbox' password is accessible, or if the user needs to re-enter it
        isLocked() {
            return this.isLoggedIn() === false || angular.isUndefined(this.getPassword());
        },

        isSecured() {
            return this.isLoggedIn() && angular.isDefined(this.getPassword());
        },

        // Return a state name to be in in case some user authentication step is required.
        // This will null if the logged in and unlocked.
        state() {
            if (this.isLoggedIn()) {
                return this.isLocked() ? 'login.unlock' : null;
            } else {
                return 'login';
            }
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
        logout(redirect, call_api) {
            call_api = angular.isDefined(call_api) ? call_api : true;
            const sessionToken = secureSessionStorage.getItem(CONSTANTS.OAUTH_KEY + ':SessionToken');
            const uid = secureSessionStorage.getItem(CONSTANTS.OAUTH_KEY + ':Uid');
            const process = function () {
                this.clearData();

                if (redirect === true) {
                    $state.go('login');
                }
            }.bind(this);

            $rootScope.loggingOut = true;

            if (call_api && (angular.isDefined(sessionToken) || angular.isDefined(uid))) {
                $http.delete(url.get() + '/auth').then(process, process);
            } else {
                process();
            }
        },

        clearData() {
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
            $rootScope.domoArigato = false;
        },

        // Returns an async promise that will be successful only if the mailbox password
        // proves correct (we test this by decrypting a small blob)
        unlockWithPassword(pwd, { PrivateKey = '', AccessToken = '', RefreshToken = '', Uid = '', ExpiresIn = 0, EventID = '', KeySalt = '' } = {}) {
            const req = $q.defer();
            if (pwd) {

                passwords.computeKeyPassword(pwd, KeySalt)
                .then((pwd) => pmcw.checkMailboxPassword(PrivateKey, pwd, AccessToken))
                .then(
                    ({ token, password }) => {
                        savePassword(password);
                        receivedCredentials({
                            AccessToken: token,
                            RefreshToken, Uid, ExpiresIn, EventID
                        });
                        req.resolve(200);
                    },
                    (rejection) => {
                        // console.log(rejection);
                        req.reject({
                            message: 'Wrong decryption password.'
                        });
                    }
                );
            }
            else {
                req.reject({
                    message: 'Password is required.'
                });
            }

            return req.promise;
        },

        fetchUserInfo() {

            const promise = auth.fetchUserInfo();

            return promise.then(
                (user) => {
                    if (user.DisplayName.length === 0) {
                        user.DisplayName = user.Name;
                    }

                    $rootScope.isLoggedIn = true;
                    $rootScope.user = user;
                    this.user = user;

                    return user;
                },
                errorReporter.catcher('Please try again later')
            );
        },

        params(params) {
            return params;
        }
    };

    return api;
})
// Global functions
.run(($rootScope, authentication) => {
    authentication.detectAuthenticationState();
    $rootScope.isLoggedIn = authentication.isLoggedIn();
    $rootScope.isLocked = authentication.isLocked();
    $rootScope.isSecure = authentication.isSecured();
});
