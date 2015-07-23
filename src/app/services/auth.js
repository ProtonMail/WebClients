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
    errorReporter,
    url,
    notify,
    CONFIG
) {
    // PRIVATE FUNCTIONS
    var auth = {
        setAuthHeaders: function() {
            // API version
            $http.defaults.headers.common.Accept = "application/vnd.protonmail.v1+json";

            // credentials
            if (auth.data.AccessToken) {
                $http.defaults.headers.common.Authorization = "Bearer " + auth.data.AccessToken;
            }
            if (auth.data.Uid) {
                $http.defaults.headers.common["x-pm-uid"] = auth.data.Uid;
            }

            // Upgrade
            $http.defaults.headers.common["x-pm-appversion"] = 'Web_' + CONFIG.app_version;
            $http.defaults.headers.common["x-pm-apiversion"] = CONFIG.api_version;
        },

        fetchUserInfo: function(uid) {
            var deferred = $q.defer();

            api.user = $http.get(url.get() + "/users", {
                params: {
                    id: uid
                }
            });

            api.user.then(
                function(result) {
                    var user = result.data.User;

                    if (!user.EncPrivateKey) {
                        api.logout();
                        deferred.reject();
                    } else {
                        $q.all([
                            $http.get(url.get() + "/contacts"),
                            $http.get(url.get() + "/labels")
                        ]).then(
                            function(result) {
                                user.Contacts = result[0].data.Contacts;
                                user.Labels = result[1].data.Labels;
                                deferred.resolve(user);
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
            window.sessionStorage[CONSTANTS.OAUTH_KEY + ":Uid"] = data.Uid;
            date = moment(Date.now() + data.ExpiresIn * 1000);
            window.sessionStorage[CONSTANTS.OAUTH_KEY + ":ExpiresIn"] = date.toISOString();
            window.sessionStorage[CONSTANTS.OAUTH_KEY + ":AccessToken"] = data.AccessToken;
            window.sessionStorage[CONSTANTS.OAUTH_KEY + ":RefreshToken"] = data.RefreshToken;
            auth.data = _.pick(data, "Uid", "AccessToken", "RefreshToken");
            auth.data.ExpiresIn = date;
            auth.setAuthHeaders();
        },

        saveEventId: function(id) {
            window.sessionStorage[CONSTANTS.EVENT_ID] = id;
        }
    };

    // RUN-TIME PUBLIC FUNCTIONS
    var api = {
        detectAuthenticationState: function() {
            var dt = window.sessionStorage[CONSTANTS.OAUTH_KEY + ":ExpiresIn"];
            if (dt) {
                dt = moment(dt);
                auth.data = {
                    Uid: window.sessionStorage[CONSTANTS.OAUTH_KEY + ":Uid"],
                    ExpiresIn: dt,
                    AccessToken: window.sessionStorage[CONSTANTS.OAUTH_KEY + ":AccessToken"],
                    RefreshToken: window.sessionStorage[CONSTANTS.OAUTH_KEY + ":RefreshToken"]
                };

                if (dt.isBefore(Date.now())) {
                    auth.data.shouldRefresh = true;
                }

                auth.mailboxPassword = api.getPassword();

                if (auth.mailboxPassword) {
                    pmcw.setMailboxPassword(auth.mailboxPassword);
                }
            }
        },

        savePassword: function(pwd) {
            window.sessionStorage[CONSTANTS.MAILBOX_PASSWORD_KEY] = pmcw.encode_base64(pwd);
        },

        getPassword: function() {
            var pwd = window.sessionStorage[CONSTANTS.MAILBOX_PASSWORD_KEY];

            return pmcw.decode_base64(pwd);
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
                return api.semiRandomString(length);
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
            var pw = pmcw.decode_base64(window.sessionStorage.getItem(CONSTANTS.MAILBOX_PASSWORD_KEY));

            return pmcw.decryptPrivateKey(this.user.EncPrivateKey, pw);
        },

        loginWithCredentials: function(creds) {
            var q = $q.defer();

            if (!creds.Username || !creds.Password) {
                q.reject({
                    message: "Username and Password are required to login"
                });
            } else {
                delete $http.defaults.headers.common.Accept;
                $rootScope.creds = creds;
                $http.post(url.get() + "/auth",
                    _.extend(_.pick(creds, "Username", "Password", "HashedPassword"), {
                        ClientID: CONFIG.clientID,
                        ClientSecret: CONFIG.clientSecret,
                        GrantType: "password",
                        State: api.randomString(24),
                        RedirectURI: "https://protonmail.ch",
                        ResponseType: "token",
                        Scope: "full" // 'full' or 'reset'
                    })
                ).then(
                    function(resp) {
                        $rootScope.TemporaryAccessData = resp.data;
                        $rootScope.TemporaryEncryptedAccessToken = resp.data.AccessToken;
                        $rootScope.TemporaryEncryptedPrivateKeyChallenge = resp.data.EncPrivateKey;
                        q.resolve(resp);
                        // this is a trick! we dont know if we should go to unlock or step2 because we dont have user's data yet. so we redirect to the login page (current page), and this is determined in the resolve: promise on that state in the route. this is because we dont want to do another fetch info here.
                    },
                    function(error) {
                        console.log(error);
                        q.reject({
                            message: error.error_description
                        });
                    }
                );
            }

            return q.promise;
        },

        // Whether a user is logged in at all
        isLoggedIn: function() {
            var loggedIn = auth.data && angular.isDefined(auth.data.AccessToken) && api.refreshTokenIsDefined();

            if (loggedIn && api.user === null) {
                auth.setAuthHeaders();
            }

            return loggedIn;
        },

        refreshTokenIsDefined: function() {
            var isDefined = false;

            if (auth.data && typeof auth.data.RefreshToken !== 'undefined' && auth.data.RefreshToken !== 'undefined') {
                isDefined = true;
            }

            return isDefined;
        },

        // Whether the mailbox' password is accessible, or if the user needs to re-enter it
        isLocked: function() {
            return !api.isLoggedIn() || _.isUndefined(auth.mailboxPassword);
        },

        // Logged in and MBPW is set
        isSecured: function() {
            return api.isLoggedIn() && !api.isLocked();
        },

        // Return a state name to be in in case some user authentication step is required.
        // This will null if the logged in and unlocked.
        state: function() {
            if (api.isLoggedIn()) {
                return api.isLocked() ? "login.unlock" : null;
            } else {
                return "login";
            }
        },

        // Redirect to a new authentication state, if required
        redirectIfNecessary: function() {
            var newState = api.state();
            if (newState) {
                $state.go(newState);
            }
        },

        refreshIfNecessary: function(force) {
            if ((auth.data && auth.data.shouldRefresh && api.refreshTokenIsDefined()) || !!force) {
                $http.post(
                    url.get() + "/auth/refresh",
                    _.extend(_.pick(auth.data, "RefreshToken"), {
                        ClientID: CONFIG.clientID,
                        ClientSecret: CONFIG.clientSecret,
                        GrantType: "refresh_token",
                        State: api.randomString(24),
                        ResponseType: "token",
                    })
                ).then(
                    function(resp) {
                        auth.saveAuthData(_.pick(resp.data, "AccessToken", "RefreshToken", "Uid", "ExpiresIn"));
                    },
                    function(resp) {
                        if(resp.error) {
                            api.logout();
                        }
                        errorReporter.catcher("Something went wrong with authentication");
                    }
                );
            }
        },

        // Removes all connection data
        logout: function() {
            // Completely clear sessionstorage
            window.sessionStorage.clear();

            delete auth.data;
            delete auth.mailboxPassword;

            this.user = null;

            // HACKY ASS BUG
            $http.delete(url.get() + "/auth").then( function() {
                location.reload();
            });

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
                        api.savePassword(pwd);
                        auth.mailboxPassword = pwd;
                        api.receivedCredentials({
                            "AccessToken": response,
                            "RefreshToken": TemporaryAccessData.RefreshToken,
                            "Uid": TemporaryAccessData.Uid,
                            "ExpiresIn": TemporaryAccessData.ExpiresIn,
                            "EventID": TemporaryAccessData.EventID
                        });
                        req.resolve(200);
                    },
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
                    message: "Password is required"
                });
            }

            return req.promise;
        },

        setTokenUID: function(data) {
            // console.log(data);
            if (data.AccessToken) {
                $http.defaults.headers.common.Authorization = "Bearer " + data.AccessToken;
            }
            if (data.Uid) {
                $http.defaults.headers.common["x-pm-uid"] = data.Uid;
            }
            // console.log($http.defaults.headers.common);
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
                        user.DisplayName = user.Addresses[0].Email;
                    }

                    $rootScope.isLoggedIn = true;
                    $rootScope.user = user;
                    this.user = user;
                    this.user.Theme = atob(user.Theme);

                    return user;
                }.bind(this),
                errorReporter.catcher("Please try again later")
            );
        },

        params: function(params) {
            return params;
        }
    };

    api.user = null;

    return api;
})

.run(function($rootScope, authentication, eventManager, CONFIG) {
    authentication.detectAuthenticationState();
    authentication.refreshIfNecessary();
    $rootScope.isLoggedIn = authentication.isLoggedIn();
    $rootScope.isLocked = authentication.isLocked();
    $rootScope.logout = function() {
        authentication.logout();
        eventManager.stop();
        $scope.error = null;
    };
});
