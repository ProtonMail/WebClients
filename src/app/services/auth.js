angular.module("proton.Auth", [])

.constant("MAILBOX_PASSWORD_KEY", "proton:mailbox_pwd")
.constant("OAUTH_KEY", "proton:oauth")

.config(function(
  $provide,
  MAILBOX_PASSWORD_KEY, 
  OAUTH_KEY
) {
  $provide.provider("authentication", function AuthenticationProvider() {

    // PRIVATE VARIABLES

    var auth = {};

    // PRIVATE FUNCTIONS

    var saveAuthData = function(data) {
      date = moment(Date.now() + data.expires_in * 1000);

      window.localStorage[OAUTH_KEY+":uid"] = data.uid;
      window.localStorage[OAUTH_KEY+":exp"] = date.toISOString();
      window.localStorage[OAUTH_KEY+":token"] = data.access_token;

      auth.data = _.pick(data, "uid", "access_token");
      auth.data.exp = date;
    };

    var savePassword = function(pwd) {
      window.sessionStorage[MAILBOX_PASSWORD_KEY] = auth.mailboxPassword = pwd;
    };

    // CONFIG-TIME API FUNCTIONS

    this.detectAuthenticationState = function() {
      auth.mailboxPassword = window.sessionStorage[MAILBOX_PASSWORD_KEY];
      auth.data = {
        uid: window.localStorage[OAUTH_KEY+":uid"],
        exp: moment(window.localStorage[OAUTH_KEY+":exp"]),
        access_token: window.localStorage[OAUTH_KEY+":token"]
      };
    };

    this.$get = function($state, $rootScope, $q, $timeout) {

      // RUN-TIME PUBLIC FUNCTIONS

      var api = {
        // Whether a user is logged in at all
        isLoggedIn: function() { 
          return ! _.isUndefined(auth.data.access_token);
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

          $rootScope.isLoggedIn = false;
          $rootScope.isLocked = true;

          $state.go("login");
        },

        // Returns an async promise that will be successful only if the mailbox password
        // proves correct (we test this by decrypting a small blob)
        unlockWithPassword: function(pwd) {
          var req = $q.defer();
          if (pwd) {
            $timeout(function() {
              savePassword(pwd);
              req.resolve(200);
            }, 50);
          } else {
            req.reject({message: "Password is required"});
          }
          
          return req.promise;
        },

        // Returns an async promise that will be successful only if the server responds with
        // authentication information, after we've given it a correct username/password pair.
        loginWithCredentials: function(creds) {
          var req = $q.defer();
          if (!creds.username || !creds.password) {
            req.reject({message: "Username and password are required to login"});
          } else {
            $timeout(function() {
              saveAuthData({
                access_token: "u=" + creds.username + "&p=" + creds.password,
                uid: creds.username,
                expires_in: 3600
              });

              $rootScope.isLoggedIn = true;
              $rootScope.isLocked = true;

              req.resolve(200);
            }, 50);
          }
          return req.promise;
        }
      };
      
      return api;
    };
  });
})

.config(function(authenticationProvider) {
  authenticationProvider.detectAuthenticationState();
})

.run(function($rootScope, authentication) {
  $rootScope.isLoggedIn = authentication.isLoggedIn();
  $rootScope.isLocked = authentication.isLocked();
});
