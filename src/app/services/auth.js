angular.module("proton.authentication", [
    "proton.pmcw",
    "proton.models"
])

.factory('authentication', function(
    $http,
    $location,
    $log,
    $q,
    $rootScope,
    $state,
    $timeout,
    CONFIG,
    CONSTANTS,
    Contact,
    errorReporter,
    Label,
    networkActivityTracker,
    notify,
    pmcw,
    url,
    User
) {
    var keys = {}; // Store decrypted keys
    var auth = {
        headersSet: false,
        // These headers are used just once for the /cookies route, then we forget them and use cookies and x-pm-session header instead.
        setAuthHeaders: function() {
            this.headersSet = true;
            // API version
            if ( auth.data.SessionToken ) {
                // we have a session token, so we can remove the old stuff
                $http.defaults.headers.common["x-pm-session"] = auth.data.SessionToken;
                $http.defaults.headers.common.Authorization = undefined;
                $http.defaults.headers.common["x-pm-uid"] = undefined;
                window.sessionStorage.removeItem(CONSTANTS.OAUTH_KEY + ":AccessToken");
                window.sessionStorage.removeItem(CONSTANTS.OAUTH_KEY + ":Uid");
                window.sessionStorage.removeItem(CONSTANTS.OAUTH_KEY + ":RefreshToken");
            } else {
                // we need the old stuff for now
                $http.defaults.headers.common["x-pm-session"] = undefined;
                $http.defaults.headers.common.Authorization = "Bearer " + auth.data.AccessToken;
                $http.defaults.headers.common["x-pm-uid"] = auth.data.Uid;
            }
        },

        fetchUserInfo: function(uid) {
            var deferred = $q.defer();

            User.get().then(function(result) {
                if (result.data && result.data.Code === 1000) {
                    var user = result.data.User;

                    if (!user.EncPrivateKey) { // Need to check something else, this is going away
                        deferred.reject({message: 'Error with EncPrivateKey'});
                        api.logout(true);
                    } else {
                        // Hacky fix for missing organizations
                        var generateOrganizationKey = $q.resolve();

                        if (user.Role === 0 && user.Subscribed === 1) {
                            var mailboxPassword = api.getPassword();

                            generateOrganizationKey = pmcw.generateKeysRSA('pm_org_admin', mailboxPassword)
                            .then(function(response) {
                                var privateKey = response.privateKeyArmored;

                                return {
                                    DisplayName: 'My Organization',
                                    PrivateKey: privateKey,
                                    BackupPrivateKey: privateKey
                                };
                            })
                            .then(function(params) {
                                return $http.post(url.get() + "/organizations", params);
                            });
                        }

                        $q.all([
                            Contact.query(),
                            Label.query(),
                            generateOrganizationKey
                        ]).then(
                            function(result) {
                                if(angular.isDefined(result[0].data) && result[0].data.Code === 1000 && angular.isDefined(result[1].data) && result[1].data.Code === 1000) {
                                    var promises = [];
                                    var mailboxPassword = api.getPassword();
                                    var keyInfo = function(key) {
                                        return pmcw.keyInfo(key.PrivateKey).then(function(info) {
                                            key.created = info.created; // Creation date
                                            key.bitSize = info.bitSize; // We don't use this data currently
                                            key.fingerprint = info.fingerprint; // Fingerprint
                                        });
                                    };

                                    user.Contacts = result[0].data.Contacts;
                                    user.Labels = result[1].data.Labels;

                                    // All private keys are decrypted with the mailbox password and stored in a `keys` array
                                    _.each(user.Addresses, function(address) {
                						_.each(address.Keys, function(key, index) {
                							promises.push(pmcw.decryptPrivateKey(key.PrivateKey, mailboxPassword).then(function(package) { // Decrypt private key with the mailbox password
                								key.decrypted = true; // We mark this key as decrypted
                								api.storeKey(address.ID, key.ID, package); // We store the package to the current service
                                                keyInfo(key);
                							}, function(error) {
                								key.decrypted = false; // This key is not decrypted
                                                keyInfo(key);
                								// If the primary (first) key for address does not decrypt, display error.
                								if(index === 0) {
                									address.disabled = true; // This address cannot be used
                									notify({message: 'Primary key for address ' + address.Email + ' cannot be decrypted. You will not be able to read or write any email from this address', classes: 'notification-danger'});
                								}
                							}));
                						});
                					});

                                    $q.all(promises).then(function() {
                                        deferred.resolve(user);
                                    }, function() {
                                        deferred.resolve(user);
                                    });
                                } else if(angular.isDefined(result[0].data) && result[0].data.Error) {
                                    deferred.reject({message: result[0].data.Error});
                                    api.logout(true);
                                } else if(angular.isDefined(result[1].data) && result[1].data.Error) {
                                    deferred.reject({message: result[1].data.Error});
                                    api.logout(true);
                                } else {
                                    deferred.reject({message: 'Error during label / contact request'});
                                    api.logout(true);
                                }
                            },
                            function() {
                                deferred.reject({message: 'Sorry, but we were unable to fully log you in.'});
                                api.logout(true);
                            }
                        );
                    }
                } else if(angular.isDefined(result.data) && result.data.Error) {
                    deferred.reject({message: result.data.Error});
                    api.logout(true);
                } else {
                    deferred.reject({message: 'Error during user request'});
                    api.logout(true);
                }
            },
            function(err) {
                deferred.reject({message: 'Sorry, but we were unable to log you in.'});
                api.logout(true);
            });

            networkActivityTracker.track(deferred.promise);

            return deferred.promise;
        },

        saveAuthData: function(data) {
            if ( data.SessionToken ) {
                window.sessionStorage[CONSTANTS.OAUTH_KEY + ":SessionToken"] = pmcw.encode_base64(data.SessionToken);
                auth.data = data;
            } else {
                window.sessionStorage[CONSTANTS.OAUTH_KEY + ":Uid"] = data.Uid;
                window.sessionStorage[CONSTANTS.OAUTH_KEY + ":AccessToken"] = data.AccessToken;
                window.sessionStorage[CONSTANTS.OAUTH_KEY + ":RefreshToken"] = data.RefreshToken;
                auth.data = _.pick(data, "Uid", "AccessToken", "RefreshToken");
            }

            auth.setAuthHeaders();
        },

        saveEventId: function(id) {
            window.sessionStorage[CONSTANTS.EVENT_ID] = id;
        }
    };

    // RUN-TIME PUBLIC FUNCTIONS
    var api = {
        user: null,
        detectAuthenticationState: function() {
            var session = window.sessionStorage[CONSTANTS.OAUTH_KEY + ":SessionToken"];

            if (session) {
                auth.data = {
                    SessionToken: pmcw.decode_base64(session)
                };

                // If session token set, we probably have a refresh token, try to refresh
                $rootScope.doRefresh = true;
            }
        },

        savePassword: function(pwd) {
            // Save password in session storage
            window.sessionStorage[CONSTANTS.MAILBOX_PASSWORD_KEY] = pmcw.encode_utf8_base64(pwd);
            // Set pmcrypto.mailboxPassword
            pmcw.setMailboxPassword(pwd);
        },

        /**
         * Return the mailbox password stored in the session storage
         */
        getPassword: function() {
            return pmcw.decode_utf8_base64(window.sessionStorage[CONSTANTS.MAILBOX_PASSWORD_KEY]);
        },

        randomString: function(length) {
            var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            var i;
            var result = "";
            var isOpera = Object.prototype.toString.call(window.opera) === '[object Opera]';

            if(window.crypto && window.crypto.getRandomValues) {
                values = new Uint32Array(length);
                window.crypto.getRandomValues(values);

                for(i=0; i<length; i++) {
                    result += charset[values[i] % charset.length];
                }

                return result;
            } else if(isOpera) { //Opera's Math.random is secure, see http://lists.w3.org/Archives/Public/public-webcrypto/2013Jan/0063.html
                for(i=0; i<length; i++) {
                    result += charset[Math.floor(Math.random()*charset.length)];
                }

                return result;
            } else {
                return this.semiRandomString(length);
            }
        },

        semiRandomString: function(size) {
            var string = "",
                i = 0,
                chars = "0123456789ABCDEF";

            while (i++ < size) {
                string += chars[Math.floor(Math.random() * 16)];
            }

            return string;
        },

        getPrivateKey: function() {
            var pw = pmcw.decode_utf8_base64(window.sessionStorage.getItem(CONSTANTS.MAILBOX_PASSWORD_KEY));

            return pmcw.decryptPrivateKey(this.user.EncPrivateKey, pw).catch( function(err) {
                $log.error( this.user.EncPrivateKey );
                throw err;
            }.bind(this));
        },

        /**
         * Return the private keys available for a specific address ID
         * @param {String} addressID
         * @return {Array}
         */
        getPrivateKeys: function(addressID) {
            return keys[addressID];
        },

        /**
         * Store package
         */
        storeKey: function(addressID, keyID, package) {
            package.ID = keyID; // Add the keyID inside the package
            keys[addressID] = keys[addressID] || []; // Initialize array for the address
            keys[addressID].push(package); // Add key package
        },

        getRefreshCookie: function() {
            $log.debug('getRefreshCookie');
            return $http.post(url.get() + '/auth/refresh', {}).then(
                function(response) {
                    $log.debug(response);
                    if (response.data.SessionToken!==undefined) {
                        $log.debug('new token',response.data.SessionToken);
                        $log.debug('before',$http.defaults.headers.common['x-pm-session']);
                        $http.defaults.headers.common['x-pm-session'] = response.data.SessionToken;
                        window.sessionStorage.setItem(CONSTANTS.OAUTH_KEY+':SessionToken', pmcw.encode_base64(response.data.SessionToken));
                        $log.debug('after',$http.defaults.headers.common['x-pm-session']);
                        $rootScope.doRefresh = true;
                    }
                    else {
                        return $q.reject(response.data.Error);
                    }
                },
                function(err) {
                    $log.error(err);
                }
            );
        },

        setAuthCookie: function(type) {
            var deferred = $q.defer();

            $log.debug('setAuthCookie');

            $http.post(url.get() + "/auth/cookies", {
                ResponseType: "token",
                ClientID: CONFIG.clientID,
                GrantType: "refresh_token",
                RefreshToken: $rootScope.TemporaryAccessData.RefreshToken,
                RedirectURI: "https://protonmail.com",
                State: this.randomString(24)
            })
            .then(
                function(response) {
                    $log.debug(response);

                    if (response.data.Code === 1000) {
                        $log.debug('/auth/cookies:', response);
                        $log.debug('/auth/cookies1: resolved');
                        $rootScope.domoArigato = true;
                        // forget the old headers, set the new ones
                        $log.debug('/auth/cookies2: resolved');
                        deferred.resolve(200);
                        $log.debug('headers change', $http.defaults.headers);

                        var data = {
                            SessionToken: response.data.SessionToken
                        };

                        auth.saveAuthData( data );

                        $rootScope.isLocked = false;
                        $rootScope.doRefresh = true;

                    } else {
                        deferred.reject({message: response.data.Error});
                        $log.error('setAuthCookie1', response);
                    }
                },
                function(error) {
                    $log.error('setAuthCookie2', error);

                    if (response.data && response.data.Error) {
                        deferred.reject({message: response.data.Error});
                    } else {
                        deferred.reject({message: "Error setting authentication cookies."});
                    }
                }
            );

            return deferred.promise;
        },

        loginWithCredentials: function(creds) {
            var deferred = $q.defer();

            if (!creds.Username || !creds.Password) {
                deferred.reject({
                    message: "Username and Password are required to login"
                });
            } else {
                delete $http.defaults.headers.common.Accept;
                $rootScope.creds = creds;
                $http.post(url.get() + "/auth",
                    _.extend(_.pick(creds, "Username", "Password"), {
                        ResponseType: "token",
                        ClientID: CONFIG.clientID,
                        ClientSecret: CONFIG.clientSecret,
                        GrantType: "password",
                        RedirectURI: "https://protonmail.com",
                        State: this.randomString(24)
                    })
                ).then(
                    function(resp) {
                        $rootScope.TemporaryAccessData = resp.data;
                        $rootScope.TemporaryEncryptedAccessToken = resp.data.AccessToken;
                        $rootScope.TemporaryEncryptedPrivateKeyChallenge = resp.data.EncPrivateKey;
                        deferred.resolve(resp);
                        // this is a trick! we dont know if we should go to unlock or step2 because we dont have user's data yet. so we redirect to the login page (current page), and this is determined in the resolve: promise on that state in the route. this is because we dont want to do another fetch info here.
                    },
                    function(error) {
                        // TODO: This is almost certainly broken, not sure it needs to work though?
                        console.log(error);
                        deferred.reject({
                            message: error.error_description
                        });
                    }
                );
            }

            return deferred.promise;
        },

        sessionTokenIsDefined: function() {
            var isDefined = false;

            if (auth.data && typeof auth.data.SessionToken !== 'undefined' && auth.data.SessionToken !== 'undefined') {
                isDefined = true;
            }

            return isDefined;
        },

        // Whether a user is logged in at all
        isLoggedIn: function() {
            var loggedIn = this.sessionTokenIsDefined();

            if (loggedIn === true && auth.headersSet === false) {
                auth.setAuthHeaders();
            }

            return loggedIn;
        },

        // Whether the mailbox' password is accessible, or if the user needs to re-enter it
        isLocked: function() {
            return this.isLoggedIn() === false || angular.isUndefined(this.getPassword());
        },

        isSecured: function() {
            return this.isLoggedIn() && angular.isDefined(this.getPassword());
        },

        // Return a state name to be in in case some user authentication step is required.
        // This will null if the logged in and unlocked.
        state: function() {
            if (this.isLoggedIn()) {
                return this.isLocked() ? "login.unlock" : null;
            } else {
                return "login";
            }
        },

        // Redirect to a new authentication state, if required
        redirectIfNecessary: function() {
            var newState = this.state();

            if (newState) {
                $state.go(newState);
            }
        },

        // refreshIfNecessary: function(force) {
        //     if ((auth.data && auth.data.shouldRefresh && this.refreshTokenIsDefined()) || !!force) {
        //         $http.post(
        //             url.get() + "/auth/refresh",
        //             _.extend(_.pick(auth.data, "RefreshToken"), {
        //                 ClientID: CONFIG.clientID,
        //                 ClientSecret: CONFIG.clientSecret,
        //                 GrantType: "refresh_token",
        //                 State: this.randomString(24),
        //                 ResponseType: "token",
        //             })
        //         ).then(
        //             function(resp) {
        //                 auth.saveAuthData(_.pick(resp.data, "AccessToken", "RefreshToken", "Uid", "ExpiresIn"));
        //             },
        //             function(resp) {
        //                 if(resp.error) {
        //                     this.logout();
        //                 }
        //                 errorReporter.catcher("Something went wrong with authentication");
        //             }
        //         );
        //     }
        // },

        /**
         * Removes all connection data
         * @param {Boolean} redirect - Redirect at the end the user to the login page
         */
        logout: function(redirect, call_api) {
            call_api = angular.isDefined(call_api) ? call_api : true;
            var sessionToken = window.sessionStorage[CONSTANTS.OAUTH_KEY+":SessionToken"];
            var uid = window.sessionStorage[CONSTANTS.OAUTH_KEY+":Uid"];
            var process = function() {
                this.clearData();

                if(redirect === true) {
                    $state.go('login');
                }
            }.bind(this);

            $rootScope.loggingOut = true;

            if( call_api && ( angular.isDefined(sessionToken) || angular.isDefined(uid) ) ) {
                $http.delete(url.get() + "/auth").then(process, process);
            } else {
                process();
            }
        },

        clearData: function() {
            // Reset $http server
            $http.defaults.headers.common["x-pm-session"] = undefined;
            $http.defaults.headers.common.Authorization = undefined;
            $http.defaults.headers.common["x-pm-uid"] = undefined;
            // Completely clear sessionstorage
            window.sessionStorage.clear();
            // Delete data key
            delete auth.data;
            // Clean keys
            keys = {};
            auth.headersSet = false;
            // Remove all user information
            this.user = null;
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
        unlockWithPassword: function(epk, pwd, accessToken, TemporaryAccessData) {
            var req = $q.defer();
            var self = this;

            if (pwd) {
                pmcw.checkMailboxPassword(epk, pwd, accessToken)
                .then(
                    function(response) {
                        this.savePassword(pwd);
                        this.receivedCredentials({
                            "AccessToken": response,
                            "RefreshToken": TemporaryAccessData.RefreshToken,
                            "Uid": TemporaryAccessData.Uid,
                            "ExpiresIn": TemporaryAccessData.ExpiresIn,
                            "EventID": TemporaryAccessData.EventID
                        });
                        req.resolve(200);
                    }.bind(this),
                    function(rejection) {
                        // console.log(rejection);
                        req.reject({
                            message: "Wrong decryption password."
                        });
                    }
                );
            }
            else {
                req.reject({
                    message: "Password is required."
                });
            }

            return req.promise;
        },

        receivedCredentials: function(data) {
            auth.saveAuthData(data);
            auth.saveEventId(data.EventID);
        },

        fetchUserInfo: function(uid) {
            var promise = auth.fetchUserInfo(uid);

            return promise.then(
                function(user) {
                    if (user.DisplayName.length === 0) {
                        user.DisplayName = user.Name;
                    }

                    $rootScope.isLoggedIn = true;
                    $rootScope.user = user;
                    this.user = user;

                    return user;
                }.bind(this),
                errorReporter.catcher("Please try again later")
            );
        },

        params: function(params) {
            return params;
        }
    };

    return api;
})
// Global functions
.run(function(
    $q,
    $rootScope,
    $state,
    gettext,
    authentication,
    Bug,
    bugModal,
    cache,
    cacheCounters,
    CONFIG,
    eventManager,
    networkActivityTracker,
    notify,
    tools
) {
    authentication.detectAuthenticationState();

    $rootScope.isLoggedIn = authentication.isLoggedIn();
    $rootScope.isLocked = authentication.isLocked();
    $rootScope.isSecure = authentication.isSecured();

    var screen;

    /**
     * Open report modal
     */
    $rootScope.openReportModal = function() {
        var username = (authentication.user && angular.isDefined(authentication.user.Name)) ? authentication.user.Name : '';
        var email = (authentication.user && angular.isArray(authentication.user.Addresses)) ? authentication.user.Addresses[0].Email : '';
        var form = {
            OS: tools.getOs(),
            OSVersion: '',
            DisplayMode: $rootScope.layoutMode,
            Resolution: window.innerHeight + ' x ' + window.innerWidth ,
            Browser: tools.getBrowser(),
            BrowserVersion: tools.getBrowserVersion(),
            Client: 'Angular',
            ClientVersion: CONFIG.app_version,
            Title: '[Angular] Bug [' + $state.$current.name + ']',
            Description: '',
            Username: username,
            Email: email
        };

        takeScreenshot().then(function() {
            bugModal.activate({
                params: {
                    form: form,
                    submit: function(form) {
                        sendBugReport(form).then(function() {
                            bugModal.deactivate();
                        });
                    },
                    cancel: function() {
                        bugModal.deactivate();
                    }
                }
            });
        });
    };

    var sendBugReport = function(form) {
        var deferred = $q.defer();

        function sendReport() {
            var bugPromise = Bug.report(form);

            bugPromise.then(
                function(response) {
                    if(response.data.Code === 1000) {
                        deferred.resolve(response);
                        notify({message: gettext('BUG_REPORTED'), classes: 'notification-success'});
                    } else if (angular.isDefined(response.data.Error)) {
                        response.message = response.data.Error;
                        deferred.reject(response);
                    }
                },
                function(err) {
                    error.message = 'Error during the sending request';
                    deferred.reject(error);
                }
            );
        }

        if (form.attachScreenshot) {
            uploadScreenshot(form).then(sendReport);
        } else {
            sendReport();
        }

        networkActivityTracker.track(deferred.promise);

        return deferred.promise;
    };

    /**
     *  Take a screenshot and store it
     */
    var takeScreenshot = function() {
        var deferred = $q.defer();

        if (html2canvas) {
            html2canvas(document.body, {
                onrendered: function(canvas) {
                    try {
                        screen = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
                    } catch(e) {
                        screen = canvas.toDataURL().split(',')[1];
                    }

                    deferred.resolve();
                }
            });
        } else {
            deferred.resolve();
        }

        return deferred.promise;
    };

    var uploadScreenshot = function(form) {
        var deferred = $q.defer();

        $.ajax({
            url: 'https://api.imgur.com/3/image',
            headers: {
                'Authorization': 'Client-ID 864920c2f37d63f'
            },
            type: 'POST',
            data: {
                'image': screen
            },
            dataType: 'json',
            success: function(response) {
                if (response && response.data && response.data.link) {
                    form.Description = form.Description+'\n\n\n\n'+response.data.link;
                    deferred.resolve();
                } else {
                    deferred.reject();
                }
            },
            error: function() {
                deferred.reject();
            }
        });

        return deferred.promise;
    };

    /**
     * Logout current session
     */
    $rootScope.logout = function() {
        eventManager.stop();
        cache.reset();
        cacheCounters.reset();
        delete $rootScope.creds;
        delete $rootScope.tempUser;
        $state.go('login');
    };
});
