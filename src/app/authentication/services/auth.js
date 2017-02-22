angular.module('proton.authentication')
.factory('authentication', (
    $http,
    $location,
    $log,
    $q,
    $rootScope,
    $state,
    $injector,
    $exceptionHandler,
    authApi,
    CONFIG,
    CONSTANTS,
    Contact,
    errorReporter,
    gettextCatalog,
    upgradePassword,
    Key,
    Label,
    networkActivityTracker,
    notify,
    pmcw,
    regexEmail,
    secureSessionStorage,
    organizationApi,
    User,
    passwords,
    srp,
    labelsModel,
    setupKeys,
    AppModel,
    upgradeKeys
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
            .then(({ data = {} }) => {
                if (data.Code === 1000) {
                    return data.User;
                }
                throw new Error(data.Error || 'Error during user request');
            })
            .then((user) => {

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

                // Hacky fix for missing organizations
                const fixOrganization = () => {
                    if (user.Role === CONSTANTS.FREE_USER_ROLE && user.Subscribed === 1) {
                        return setupKeys.generateOrganization(api.getPassword())
                        .then((response) => {
                            const privateKey = response.privateKeyArmored;

                            return {
                                DisplayName: 'My Organization',
                                PrivateKey: privateKey
                            };
                        })
                        .then((params) => {
                            return organizationApi.create(params);
                        });
                    }
                    return Promise.resolve();
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
                        labelsModel.set(labels.data.Labels);
                        return { user, organizationKey };
                    }

                    if (contacts.data && contacts.data.Error) {
                        throw new Error(contacts.data.Error);
                    }

                    if (labels.data && labels.data.Error) {
                        throw new Error(labels.data.Error);
                    }

                    throw new Error('Error during label / contact request');
                })
                .then(({ user, organizationKey }) => {

                    const storeKeys = (keys) => {
                        api.clearKeys();
                        _.each(keys, ({ address, key, pkg }) => {
                            api.storeKey(address.ID, key.ID, pkg);
                        });
                    };

                    return setupKeys.decryptUser(user, organizationKey, api.getPassword())
                        .then(({ keys }) => (storeKeys(keys), user))
                        .catch((error) => {
                            $exceptionHandler(error);
                            throw error;
                        });
                });
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

        savePassword(pwd) {
            // Never save mailbox password changes if sub user
            if (this.user && this.user.OrganizationPrivateKey) {
                return;
            }

            // Save password in session storage
            secureSessionStorage.setItem(CONSTANTS.MAILBOX_PASSWORD_KEY, pmcw.encode_utf8_base64(pwd));
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

        checkKeysFormat(user){
            const primaryKeys = keys['0'];
            let allPrivateKeys = primaryKeys;
            let promises = [];

            //For primary keys, we will determine which email to use by comparing their fingerprints with the address keys
            for (var i in primaryKeys) {
                const privKey = primaryKeys[i];
                const userId = privKey.users[0].userId.userid;
                const fingerprint = privKey.primaryKey.fingerprint;

                let email = ""
                for (var j in user.Addresses) {
                    const foundKey = _.findWhere(user.Addresses[j].Keys, { Fingerprint: fingerprint });
                    if (foundKey) {
                        email = user.Addresses[j].Email;
                    }
                }
                //If there is no matching fingerprint, we will just make sure the User ID matches the pattern "something <email>"
                if (email === ""){
                    const split = userId.split(" ");
                    if (split.length !== 2){
                        return Promise.reject('Invalid UserID ' + userId);
                    }
                    const emailWithBrackets = split[1]
                    email = emailWithBrackets.substring(1, emailWithBrackets.length - 1);
                    if (emailWithBrackets[0] !== "<" || emailWithBrackets[emailWithBrackets.length - 1] !== ">" || !regexEmail.test(email)) {
                        return Promise.reject('Invalid UserID ' + userId);
                    }
                }

                const keyInfo =
                    pmcw.keyInfo(privKey.armor(), email, false)
                    .then((info) => {
                        if (info.validationError !== null){
                            return Promise.reject(info.validationError);
                        }
                    });
                promises.push(keyInfo);
            }

            //Now we check the User IDs of the address keys
            for (var addressID in keys) {
                if (addressID === '0') {
                    //These are primary keys, we already checked their user IDs earlier
                    continue;
                }
                const address = _.findWhere(user.Addresses, { ID: addressID });
                const email = address.Email;
                let privKeys = keys[addressID];
                allPrivateKeys = allPrivateKeys.concat(privKeys);

                for (var i in privKeys){
                    const privKey = privKeys[i];

                    const keyInfo =
                        pmcw.keyInfo(privKey.armor(), email, false)
                        .then((info) => {
                            if (info.validationError !== null){
                                return Promise.reject(info.validationError);
                            }
                        });

                    promises.push(keyInfo);
                }
            }
            promises.push(pmcw.signMessage(allPrivateKeys));
            return Promise.all(promises);
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
            return authApi.refresh({}).then(
                (response) => {
                    $log.debug(response);
                    if (response.data.SessionToken !== undefined) {
                        $log.debug('new token', response.data.SessionToken);
                        $log.debug('before', $http.defaults.headers.common['x-pm-session']);
                        $http.defaults.headers.common['x-pm-session'] = response.data.SessionToken;
                        secureSessionStorage.setItem(CONSTANTS.OAUTH_KEY + ':SessionToken', pmcw.encode_base64(response.data.SessionToken));
                        $log.debug('after', $http.defaults.headers.common['x-pm-session']);
                        $rootScope.doRefresh = true;
                    } else {
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

            authApi.cookies({
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
                    // Upgrade users to the newest auth version
                    if (resp.authVersion < passwords.currentAuthVersion) {
                        srp.getPasswordParams(creds.Password)
                        .then((data) => {
                            upgradePassword.store(data);
                            deferred.resolve(resp);
                        });
                    } else {
                        deferred.resolve(resp);
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
            const sessionToken = secureSessionStorage.getItem(CONSTANTS.OAUTH_KEY + ':SessionToken');
            const uid = secureSessionStorage.getItem(CONSTANTS.OAUTH_KEY + ':Uid');
            const process = () => {
                this.clearData();

                if (redirect === true) {
                    $state.go('login');
                }
            };

            $rootScope.loggingOut = true;

            if (callApi && (angular.isDefined(sessionToken) || angular.isDefined(uid))) {
                authApi.revoke().then(process, process);
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
            AppModel.set('loggedIn', false);
        },

        // Returns an async promise that will be successful only if the mailbox password
        // proves correct (we test this by decrypting a small blob)
        unlockWithPassword(pwd, { PrivateKey = '', AccessToken = '', RefreshToken = '', Uid = '', ExpiresIn = 0, EventID = '', KeySalt = '' } = {}) {
            const req = $q.defer();
            if (pwd) {

                $rootScope.plainMailboxPass = pwd;
                passwords.computeKeyPassword(pwd, KeySalt)
                .then((pwd) => pmcw.checkMailboxPassword(PrivateKey, pwd, AccessToken))
                .then(
                    ({ token, password }) => {
                        savePassword(password);
                        receivedCredentials({
                            AccessToken: token,
                            RefreshToken, Uid, ExpiresIn, EventID
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

            return promise.then((user) => {
                if (user.DisplayName.length === 0) {
                    user.DisplayName = user.Name;
                }

                if ($rootScope.plainMailboxPass) {
                    this.checkKeysFormat(user)
                    .catch(( err ) => {
                         upgradeKeys({mailboxPassword: $rootScope.plainMailboxPass, oldSaltedPassword: this.getPassword(), user})
                         .then(() => {
                            $rootScope.plainMailboxPass = null;
                         });
                    });
                }

                $rootScope.isLoggedIn = true;
                this.user = user;
                $rootScope.user = user;

                return user;
            })
            .catch((error) => {
                $state.go('support.message', {
                    data: {
                        title: 'Problem loading your account',
                        content: 'ProtonMail encountered a problem loading your account. Please try again later',
                        type: 'alert-danger'
                    }
                });
                throw error;
            });
        },

        params(params) {
            return params;
        }
    };

    return api;
});
