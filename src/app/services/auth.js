angular.module("proton.authentication", [
    "proton.pmcw",
    "proton.models"
])

.constant("MAILBOX_PASSWORD_KEY", "proton:mailbox_pwd")
.constant("OAUTH_KEY", "proton:oauth")

.config(function(
    $provide,
    MAILBOX_PASSWORD_KEY,
    OAUTH_KEY
) {
    $provide.provider("authentication", function AuthenticationProvider(pmcwProvider) {
        // PRIVATE VARIABLES
        var auth = {};
        var baseURL;

        auth.provider = this;

        // PRIVATE FUNCTIONS

        auth.saveAuthData = function(data) {
            date = moment(Date.now() + data.ExpiresIn * 1000);

            window.localStorage[OAUTH_KEY + ":Uid"] = data.Uid;
            window.localStorage[OAUTH_KEY + ":ExpiresIn"] = date.toISOString();
            window.localStorage[OAUTH_KEY + ":AccessToken"] = data.AccessToken;
            window.localStorage[OAUTH_KEY + ":RefreshToken"] = data.RefreshToken;

            auth.data = _.pick(data, "Uid", "AccessToken", "RefreshToken");
            auth.data.ExpiresIn = date;

            auth.setAuthHeaders();
        };

        auth.savePassword = function(pwd) {
            window.sessionStorage[MAILBOX_PASSWORD_KEY] = auth.mailboxPassword = pwd;
        };

        // CONFIG-TIME API FUNCTIONS

        this.detectAuthenticationState = function() {
            var dt = window.localStorage[OAUTH_KEY + ":ExpiresIn"];
            if (dt) {
                dt = moment(dt);
                auth.data = {
                    Uid: window.localStorage[OAUTH_KEY + ":Uid"],
                    ExpiresIn: dt,
                    AccessToken: window.localStorage[OAUTH_KEY + ":AccessToken"],
                    RefreshToken: window.localStorage[OAUTH_KEY + ":RefreshToken"]
                };

                if (dt.isBefore(Date.now())) {
                    auth.data.shouldRefresh = true;
                }

                auth.mailboxPassword = window.sessionStorage[MAILBOX_PASSWORD_KEY];
                if (auth.mailboxPassword) {
                    pmcwProvider.setMailboxPassword(auth.mailboxPassword);
                }
            }
        };

        this.setAPIBaseURL = function(newBaseURL) {
            if (!baseURL) {
                baseURL = this.baseURL = newBaseURL;
            }
        };

        this.$get = function(
            $state,
            $rootScope,
            $q,
            $http,
            $timeout,
            $injector,
            pmcw,
            localStorageService,
            errorReporter,
            notify
        ) {

            // RUN-TIME PUBLIC FUNCTIONS

            var api = {

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
                        return semiRandomString(length);
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
                    var pw = pmcw.decode_utf8_base64(localStorageService.get('protonmail_pw'));

                    return pmcw.decryptPrivateKey(this.user.EncPrivateKey, pw);
                },

                loginWithCredentials: function(creds) {
                    var q = $q.defer();

                    if (!creds.Username || !creds.Password) {
                        q.reject({
                            message: "Username and Password are required to login"
                        });
                    }
                    else {
                        delete $http.defaults.headers.common.Accept;
                        $http.post(baseURL + "/auth",
                            _.extend(_.pick(creds, "Username", "Password"), {
                                ClientID: "demoapp",
                                ClientSecret: "demopass",
                                GrantType: "password",
                                State: api.randomString(24),
                                RedirectURI: "https://protonmail.ch",
                                ResponseType: "token"
                            })
                        ).then(
                            function(resp) {
                                var data = resp.data;
                                api.receivedCredentials(
                                    _.pick(data, "AccessToken", "RefreshToken", "Uid", "ExpiresIn")
                                );
                                q.resolve(data);
                                // this is a trick! we dont know if we should go to unlock or step2 because we dont have user's data yet. so we redirect to the login page (current page), and this is determined in the resolve: promise on that state in the route. this is because we dont want to do another fetch info here.
                            },
                            function(error) {
                                q.reject({
                                    message: error.error_description
                                });
                            });
                    }

                    return q.promise;
                },

                // Whether a user is logged in at all
                isLoggedIn: function() {
                    var loggedIn = auth.data && !_.isUndefined(auth.data.AccessToken) && api.refreshTokenIsDefined();

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
                            baseURL + "/auth/refresh",
                            _.extend(_.pick(auth.data, "RefreshToken"), {
                                ClientID: "demoapp",
                                GrantType: "refresh_token",
                                State: api.randomString(24),
                                ResponseType: "token"
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
                    window.localStorage.clear();
                    window.sessionStorage.clear();

                    delete auth.data;
                    delete auth.mailboxPassword;

                    this.user = null;

                    $rootScope.isLoggedIn = false;
                    $rootScope.isLocked = true;
                    $rootScope.isSecure = false;

                    $state.go("login");
                },

                // Returns an async promise that will be successful only if the mailbox password
                // proves correct (we test this by decrypting a small blob)
                unlockWithPassword: function(pwd) {

                    var req = $q.defer();
                    var self = this;

                    if (pwd) {

                        var $getUser = $http.get(baseURL + "/users", {
                            params: {
                                id: auth.data.Uid
                            }
                        });

                        $getUser.then(
                            function(result) {
                                var user = result.data.User;
                                return pmcw.checkMailboxPassword(user.PublicKey, user.EncPrivateKey, pwd).then(
                                    function() {
                                        auth.savePassword(pwd);
                                        req.resolve(200);
                                    },
                                    function(rejection) {
                                        req.reject({
                                            message: "We are unable to decrypt your mailbox, most likely, you entered the wrong decryption password. Please try again."
                                        });
                                    }
                                );
                            },
                            function(rejection) {
                                req.reject({
                                    message: "We are unable to decrypt your mailbox, most likely, you entered the wrong decryption password. Please try again."
                                });
                            }
                        );
                    } else {
                        req.reject({
                            message: "Password is required"
                        });
                    }

                    return req.promise;
                },

                receivedCredentials: function(data) {
                    auth.saveAuthData(data);
                },

                fetchUserInfo: function() {
                    var promise = auth.fetchUserInfo();
                    return promise.then(
                        function(user) {
                            if (user.DisplayName.length === 0) {
                                user.DisplayName = user.Addresses[0].Email;
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

            auth.setAuthHeaders = function() {
                // API version
                $http.defaults.headers.common.Accept = "application/vnd.protonmail.v1+json";

                // credentials
                $http.defaults.headers.common.Authorization = "Bearer " + auth.data.AccessToken;
                $http.defaults.headers.common["x-pm-uid"] = auth.data.Uid;
            };

            auth.fetchUserInfo = function() {
                var q = $q.defer();

                api.user = $http.get(baseURL + "/users", {
                    params: {
                        id: auth.data.Uid
                    }
                });

                api.user.then(
                    function(result) {
                        var user = result.data.User;

                        if (!user.EncPrivateKey) {
                            api.logout();
                            q.reject();
                        } else {
                            $q.all([
                                $http.get(baseURL + "/contacts"),
                                $http.get(baseURL + "/labels")
                            ]).then(
                                function(result) {
                                    user.Contacts = result[0].data.Contacts;
                                    user.Labels = result[1].data.Labels;
                                    q.resolve(user);
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
                    function() {
                        notify({
                            classes: 'notification-danger',
                            message: 'Sorry, but we were unable to log you in.'
                        });
                        api.logout();
                    }
                );

                return q.promise;
            };

            api.baseURL = baseURL;
            api.user = null;

            return typeof Object.seal !== "undefined" ? Object.seal(api) : api;
        };
    });
})

.config(function(authenticationProvider) {
    authenticationProvider.detectAuthenticationState();
})

.run(function($rootScope, authentication) {
    authentication.refreshIfNecessary();
    $rootScope.isLoggedIn = authentication.isLoggedIn();
    $rootScope.isLocked = authentication.isLocked();
    $rootScope.logout = function() {
        authentication.logout();
        $scope.error = null;
    };
});
