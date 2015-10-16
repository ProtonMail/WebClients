angular.module("proton.authentication", [
    "proton.pmcw",
    "proton.models"
])

.factory('authentication', function(
    pmcw,
    CONSTANTS,
    $state,
    $rootScope,
    $q,
    $http,
    $timeout,
    $log,
    errorReporter,
    url,
    notify,
    CONFIG
) {

    // PRIVATE FUNCTIONS
    var auth = {

        // These headers are used just once for the /cookies route, then we forget them and use cookies and x-pm-session header instead.
        setAuthHeaders: function() {

            this.headersSet = true;
            // API version
            if ( auth.data.SessionToken ) {
                // we have a session token, so we can remove the old stuff
                $log.debug('setAuthHeaders:1');
                $http.defaults.headers.common["x-pm-session"] = auth.data.SessionToken;
                $http.defaults.headers.common.Authorization = undefined;
                $http.defaults.headers.common["x-pm-uid"] = undefined;
                window.sessionStorage.removeItem(CONSTANTS.OAUTH_KEY + ":AccessToken");
                window.sessionStorage.removeItem(CONSTANTS.OAUTH_KEY + ":Uid");
                window.sessionStorage.removeItem(CONSTANTS.OAUTH_KEY + ":RefreshToken");
            }
            else {
                // we need the old stuff for now
                $log.debug('setAuthHeaders:2');
                $http.defaults.headers.common.Authorization = "Bearer " + auth.data.AccessToken;
                $http.defaults.headers.common["x-pm-uid"] = auth.data.Uid;
            }
        },

        fetchUserInfo: function(uid) {

            var deferred = $q.defer();

            $http.get(url.get() + "/users", {
                params: {
                    id: uid
                }
            }).then(
                function(result) {

                    var user = result.data.User;

                    if (!user.EncPrivateKey) {
                        api.logout();
                        deferred.reject();
                    }
                    else {
                        $q.all([
                            $http.get(url.get() + "/contacts"),
                            $http.get(url.get() + "/labels")
                        ]).then(
                            function(result) {
                                user.Contacts = result[0].data.Contacts;
                                user.Labels = result[1].data.Labels;
                                return deferred.resolve(user);
                            },
                            function() {
                                notify({
                                    classes: 'notification-danger',
                                    message: 'Sorry, but we were unable to fully log you in.'
                                });
                                api.logout();
                            }
                        );
                    }
                },
                function(err) {
                    console.log(err);
                    notify({
                        classes: 'notification-danger',
                        message: 'Sorry, but we were unable to log you in.'
                    });
                    api.logout();
                }
            );

            return deferred.promise;
        },

        saveAuthData: function(data) {
            $log.debug('saveAuthData');
            if ( data.SessionToken ) {
                window.sessionStorage[CONSTANTS.OAUTH_KEY + ":SessionToken"] = pmcw.encode_base64(data.SessionToken);
                auth.data = data;
            }
            else {
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
        detectAuthenticationState: function() {
            var session = window.sessionStorage[CONSTANTS.OAUTH_KEY + ":SessionToken"];
            if (session) {
                auth.data = {
                    SessionToken: pmcw.decode_base64(session)
                };

                auth.mailboxPassword = this.getPassword();

                if (auth.mailboxPassword) {
                    pmcw.setMailboxPassword(auth.mailboxPassword);
                }
            }
        },

        savePassword: function(pwd) {
            // Why is this saved in three different places?
            window.sessionStorage[CONSTANTS.MAILBOX_PASSWORD_KEY] = pmcw.encode_utf8_base64(pwd);
            auth.mailboxPassword = pwd;
            pmcw.setMailboxPassword(pwd);
        },

        getPassword: function() {
            var pwd = window.sessionStorage[CONSTANTS.MAILBOX_PASSWORD_KEY];

            return pmcw.decode_utf8_base64(pwd);
        },

        randomString: function(length)
        {
            var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            var i;
            var result = "";
            var isOpera = Object.prototype.toString.call(window.opera) === '[object Opera]';
            if(window.crypto && window.crypto.getRandomValues)
            {
                values = new Uint32Array(length);
                window.crypto.getRandomValues(values);
                for(i=0; i<length; i++)
                {
                    result += charset[values[i] % charset.length];
                }
                return result;
            }
            else if(isOpera)
            {
                //Opera's Math.random is secure, see http://lists.w3.org/Archives/Public/public-webcrypto/2013Jan/0063.html
                for(i=0; i<length; i++)
                {
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

        getRefreshCookie: function() {
            $log.debug('getRefreshCookie');
            return $http.post(url.get() + "/auth/refresh",
            {})
            .then(
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
                },
                function(err) {
                    $log.error(err);
                }
            );
        },

        setAuthCookie: function(type) {
            var deferred = $q.defer();

            $log.debug('setAuthCookie');

            $http.post(url.get() + "/auth/cookies",
            {
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
                        $log.debug('/auth/cookies:',response);
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
                function(err) {
                    $log.error('setAuthCookie2', err);
                    deferred.reject({ message: "Error setting authentication cookies." });
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
                        State: this.randomString(24),
                        Scope: "full" // 'full' or 'reset'
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

        // Whether a user is logged in at all
        isLoggedIn: function() {
            // $log.debug('isLoggedIn');
            // console.log(auth);
            // console.log(auth.data);
            // console.log(this.refreshTokenIsDefined());

            var loggedIn = auth.data && this.sessionTokenIsDefined();

            if (loggedIn && !!!auth.headersSet) {
                auth.setAuthHeaders();
            }
            // $log.debug('isLoggedIn:',loggedIn);
            return loggedIn;
        },

        sessionTokenIsDefined: function() {
            var isDefined = false;

            if (auth.data && typeof auth.data.SessionToken !== 'undefined' && auth.data.SessionToken !== 'undefined') {
                isDefined = true;
            }

            return isDefined;
        },

        // Whether the mailbox' password is accessible, or if the user needs to re-enter it
        isLocked: function() {
            return !this.isLoggedIn() || _.isUndefined(auth.mailboxPassword);
        },

        // TODO, aren't isLocked and isSecured exact opposites of one another? Why do they both exist?
        // Logged in and MBPW is set
        isSecured: function() {
            return this.isLoggedIn() && !this.isLocked();
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

        // Removes all connection data
        logout: function(reload) {

            if (reload===undefined) {
                reload = true;
            }
            
            var sessionToken = window.sessionStorage[CONSTANTS.OAUTH_KEY+":SessionToken"];
            var uid = window.sessionStorage[CONSTANTS.OAUTH_KEY+":Uid"];

            // HACKY ASS BUG
            var clearData = function() {

                // Completely clear sessionstorage
                window.sessionStorage.clear();

                delete auth.data;
                delete auth.mailboxPassword;
                auth.headersSet = false;
                // TODO clean this, up, need to reset $http headers if we hope to get rid of hack

                this.user = null;
                window.onbeforeunload = undefined;
                if (reload) {
                    location.reload();
                }
            };

            if(angular.isDefined(sessionToken) || angular.isDefined(uid)) {
                $http.delete(url.get() + "/auth").then( clearData, clearData );
            } else {
                clearData();
            }

            // THIS SHOULD BE RE-ENABLED WHEN WE FIX THE BUG
            // $rootScope.isLoggedIn = false;
            // $rootScope.isLocked = true;
            // $rootScope.isSecure = false;
            // $rootScope.domoArigato = false;

        },

        // Returns an async promise that will be successful only if the mailbox password
        // proves correct (we test this by decrypting a small blob)
        unlockWithPassword: function(epk, pwd, accessToken, TemporaryAccessData) {

            // console.log(epk, pwd, accessToken, TemporaryAccessData);

            var req = $q.defer();
            var self = this;

            if (pwd) {

                pmcw.checkMailboxPassword(epk, pwd, accessToken)
                .then(
                    function(response) {
                        this.savePassword(pwd);
                        auth.mailboxPassword = pwd;
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

                    // console.log(user);

                    if (user.DisplayName.length === 0) {
                        user.DisplayName = user.Name;
                    }

                    $rootScope.isLoggedIn = true;
                    // Why are we setting this in two places?
                    $rootScope.user = user;
                    this.user = user;
                    this.user.Theme = user.Theme;

                    return user;
                }.bind(this),
                errorReporter.catcher("Please try again later")
            );
        },

        params: function(params) {
            return params;
        }
    };

    // Initialization
    api.user = null;
    auth.headersSet = false;

    return api;
})

.run(function($rootScope, authentication, eventManager, CONFIG) {
    authentication.detectAuthenticationState();
    //authentication.refreshIfNecessary();
    $rootScope.isLoggedIn = authentication.isLoggedIn();
    $rootScope.isLocked = authentication.isLocked();
    $rootScope.logout = function() {
        eventManager.stop();
        authentication.logout();
    };
});
