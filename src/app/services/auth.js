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
        auth.provider = this;

        var baseURL;

        // PRIVATE FUNCTIONS

        auth.saveAuthData = function(data) {
            date = moment(Date.now() + data.expires_in * 1000);

            window.localStorage[OAUTH_KEY + ":uid"] = data.uid;
            window.localStorage[OAUTH_KEY + ":exp"] = date.toISOString();
            window.localStorage[OAUTH_KEY + ":access_token"] = data.access_token;
            window.localStorage[OAUTH_KEY + ":refresh_token"] = data.refresh_token;

            auth.data = _.pick(data, "uid", "access_token", "refresh_token");
            auth.data.exp = date;

            auth.setAuthHeaders();
        };

        auth.savePassword = function(pwd) {
            window.sessionStorage[MAILBOX_PASSWORD_KEY] = auth.mailboxPassword = pwd;
        };

        // CONFIG-TIME API FUNCTIONS

        this.detectAuthenticationState = function() {
            var dt = window.localStorage[OAUTH_KEY + ":exp"];
            if (dt) {
                dt = moment(dt);
                auth.data = {
                    uid: window.localStorage[OAUTH_KEY + ":uid"],
                    exp: dt,
                    access_token: window.localStorage[OAUTH_KEY + ":access_token"],
                    refresh_token: window.localStorage[OAUTH_KEY + ":refresh_token"]
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
            errorReporter
        ) {

            // RUN-TIME PUBLIC FUNCTIONS

            var api = {

                // TODO update to more secure PRNG
                randomString: function(size) {
                    var string = "",
                        i = 0,
                        chars = "0123456789ABCDEF";

                    while (i++ < size) {
                        string += chars[Math.floor(Math.random() * 16)];
                    }

                    return string;
                },

                loginWithCredentials: function(creds) {
                    var q = $q.defer();
                    if (!creds.username || !creds.password) {
                        q.reject({
                            message: "Username and password are required to login"
                        });
                    } else {
                        delete $http.defaults.headers.common.Accept;
                        $http.post(baseURL + "/auth/auth",
                            _.extend(_.pick(creds, "username", "password"), {
                                client_id: "demoapp",
                                client_secret: "demopass",
                                hashedpassword: "",
                                grant_type: "password",
                                state: api.randomString(24),
                                redirect_uri: "https://protonmail.ch",
                                response_type: "token"
                            })
                        ).then(function(resp) {
                                var data = resp.data;
                                api.receivedCredentials(
                                    _.pick(data, "access_token", "refresh_token", "uid", "expires_in")
                                );
                                // this is a trick! we dont know if we should go to unlock or step2 because we dont have user's data yet. so we redirect to the login page (current page), and this is determined in the resolve: promise on that state in the route. this is because we dont want to do another fetch info here.
                                $state.go("login").then(
                                    function() {
                                        q.resolve(data);
                                    }
                                );
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
                    var loggedIn = auth.data && !_.isUndefined(auth.data.access_token) && api.refreshTokenIsDefined();

                    if (loggedIn && api.user === null) {
                        auth.setAuthHeaders();
                    }

                    return loggedIn;
                },

                refreshTokenIsDefined: function() {
                    var isDefined = false;

                    if (auth.data && typeof auth.data.refresh_token !== 'undefined' && auth.data.refresh_token !== 'undefined') {
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
                            _.extend(_.pick(auth.data, "access_token", "refresh_token"), {
                                client_id: "demoapp",
                                grant_type: "refresh_token",
                                response_type: "token"
                            })
                        ).then(
                            function(resp) {
                                auth.saveAuthData(_.pick(resp.data, "access_token", "refresh_token", "uid", "expires_in"));
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
                        $timeout(function() {
                            self.user.$promise.then(function(user) {
                                pmcw.checkMailboxPassword(user.PublicKey, user.EncPrivateKey, pwd).then(function() {
                                    auth.savePassword(pwd);
                                    req.resolve(200);
                                }, function(rejection) {
                                    req.reject({
                                        message: "We are unable to decrypt your mailbox, most likely, you entered the wrong decryption password. Please try again."
                                    });
                                });
                            });
                        }, 200);
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
                            $rootScope.isLocked = true;
                            return user;
                        },
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
                $http.defaults.headers.common.Authorization = "Bearer " + auth.data.access_token;
                $http.defaults.headers.common["x-pm-uid"] = auth.data.uid;
            };

            auth.fetchUserInfo = function() {
                var q = $q.defer();

                api.user = $injector.get("User").get({
                    UserID: auth.data.uid
                });

                api.user.$promise.then(function(user) {
                    if (!user.EncPrivateKey) {
                        api.logout();
                        q.reject();
                    } else {
                        $q.all([
                            $injector.get("Contact").query().$promise,
                            $injector.get("Label").get().$promise
                        ]).then(function(result) {
                            user.contacts = result[0];
                            user.labels = result[1];
                            q.resolve(user);
                        });
                    }
                });

                return q.promise;
            };

            api.baseURL = baseURL;
            api.user = null;

            return typeof Object.seal !== "undefined" ? Object.seal(api) : api;
        };
    });
})

.config(function(authenticationProvider, $httpProvider) {
    authenticationProvider.detectAuthenticationState();
    $httpProvider.interceptors.push(function($q) {
        return {
            // Add an interceptor that will change a HTTP 200 success response containing
            // a { "error": <something> } body into a failing response
            response: function(response) {
                if (response.data && response.data.error) {
                    var q = $q.defer();
                    q.reject(response.data);
                    return q.promise;
                }

                return response;
            }
        };
    });
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
