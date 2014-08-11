angular.module("proton.Auth", [
  "proton.Crypto",
  "proton.Models"
])

.constant("MAILBOX_PASSWORD_KEY", "proton:mailbox_pwd")
.constant("OAUTH_KEY", "proton:oauth")

.config(function(
  $provide,
  MAILBOX_PASSWORD_KEY, 
  OAUTH_KEY
) {
  $provide.provider("authentication", function AuthenticationProvider(cryptoProvider) {

    // PRIVATE VARIABLES

    var auth = {};
    auth.provider = this;

    var baseURL;

    // PRIVATE FUNCTIONS

    auth.saveAuthData = function(data) {
      date = moment(Date.now() + data.expires_in * 1000);

      window.localStorage[OAUTH_KEY+":uid"] = data.uid;
      window.localStorage[OAUTH_KEY+":exp"] = date.toISOString();
      window.localStorage[OAUTH_KEY+":token"] = data.access_token;

      auth.data = _.pick(data, "uid", "access_token");
      auth.data.exp = date;
    };

    auth.savePassword = function(pwd) {
      window.sessionStorage[MAILBOX_PASSWORD_KEY] = auth.mailboxPassword = pwd;
    };

    // CONFIG-TIME API FUNCTIONS

    this.detectAuthenticationState = function() {
      auth.mailboxPassword = window.sessionStorage[MAILBOX_PASSWORD_KEY];
      if (auth.mailboxPassword) {
        cryptoProvider.setMailboxPassword(auth.mailboxPassword);
      }

      var dt = window.localStorage[OAUTH_KEY+":exp"];
      if (dt) {
        dt = moment(dt);
        if (!dt.isBefore(Date.now())) {
          auth.data = {
            uid: window.localStorage[OAUTH_KEY+":uid"],
            exp: dt,
            access_token: window.localStorage[OAUTH_KEY+":token"]
          };
        } else {
          _.each(["uid", "exp", "token"], function(key) {
            delete window.localStorage[OAUTH_KEY+":"+key];
          });
        }
      }
    };
    
    this.setAPIBaseURL = function(newBaseURL) {
      if (!baseURL) {
        baseURL = this.baseURL = newBaseURL;
      }
    };

    this.$get = function($state, $rootScope, $q, $http, $timeout, crypto, $injector) {

      // RUN-TIME PUBLIC FUNCTIONS

      var api = {
        // Whether a user is logged in at all
        isLoggedIn: function() { 
          var loggedIn = auth.data && ! _.isUndefined(auth.data.access_token);
          if (loggedIn && api.user === null) {
            auth.fetchUserInfo();
          }
          return loggedIn;
        },

        // Whether the mailbox' password is accessible, or if the user needs to re-enter it
        isLocked: function() {
          return ! api.isLoggedIn() || _.isUndefined(auth.mailboxPassword);
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

        // Removes all connection data
        logout: function() {
          _.each(["uid", "exp", "token"], function(key) {
            delete window.localStorage[OAUTH_KEY+":"+key];
          });
          delete window.sessionStorage[MAILBOX_PASSWORD_KEY];

          delete auth.data;
          delete auth.mailboxPassword;
          
          this.user = null;

          $rootScope.isLoggedIn = false;
          $rootScope.isLocked = true;

          $state.go("login");
        },

        // Returns an async promise that will be successful only if the mailbox password
        // proves correct (we test this by decrypting a small blob)
        unlockWithPassword: function(pwd) {
          var req = $q.defer();
          var self = this;
          if (pwd) {
            $timeout(function() {
              self.user.$promise.then(function (user) {
                if (crypto.setMailboxPassword(user.PublicKey, user.EncPrivateKey, pwd)) {
                  auth.savePassword(pwd);

                  $rootScope.isLoggedIn = true;
                  $rootScope.isLocked = false;

                  req.resolve(200);
                } else {
                  req.reject({message: "We are unable to decrypt your mailbox, most likely, you entered the wrong decryption password. Please try again."})
                }
              });
            }, 1000);
          } else {
            req.reject({message: "Password is required"});
          }
          
          return req.promise;
        },

        // Returns an async promise that will be successful only if the server responds with
        // authentication information, after we've given it a correct username/password pair.
        loginWithCredentials: function(creds) {
          var q = $q.defer();

          if (!creds.username || !creds.password) {
            q.reject({message: "Username and password are required to login"});
          } else {
            $http.post(baseURL + "/auth/auth", 
              _.extend(_.pick(creds, "username", "password"), {
                client_id: "this_is_test_app_id",
                response_type: "password"
              })
            ).then(function(resp) {
              var data = resp.data;
              if (data.message) {
                q.reject(_.pick(data, "message"));
              } else {
                auth.saveAuthData(_.pick(data, "access_token", "uid", "expires_in"));
                auth.fetchUserInfo($http);

                $rootScope.isLoggedIn = true;
                $rootScope.isLocked = true;

                q.resolve(200);
              }
            });
          }

          return q.promise;
        },

        params: function (params) {
          return _.extend({ 
            access_token: function() {
              return auth.data.access_token;
            }
          }, params);
        }
      };

      auth.fetchUserInfo = function() {
        $http.defaults.headers.common.uid = auth.data.uid;
        api.user = $injector.get("User").get();
      };
      
      api.baseURL = baseURL;
      api.user = null;

      return typeof Object.seal !== "undefined" ? Object.seal(api) : api;
    };
  });
})

.config(function(authenticationProvider, $httpProvider) {
  authenticationProvider.detectAuthenticationState();
  $httpProvider.defaults.headers.common.api_version = "1";
})

.run(function($rootScope, authentication) {
  $rootScope.isLoggedIn = authentication.isLoggedIn();
  $rootScope.isLocked = authentication.isLocked();
});
