angular.module("proton.Auth", [
  "proton.Crypto"
])

.constant("MAILBOX_PASSWORD_KEY", "proton:mailbox_pwd")
.constant("OAUTH_KEY", "proton:oauth")

.constant("FAKE_ENCPRIVKEY", "-----BEGIN PGP PRIVATE KEY BLOCK-----\nVersion: OpenPGP.js v0.7.0\nComment: http://openpgpjs.org\n\n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\nSN9xueuX5DnlnzSI3Ezg5t/jSVfHS5DsLQ==\n=WWLj\n-----END PGP PRIVATE KEY BLOCK-----\n")
.constant("FAKE_PUBKEY", "-----BEGIN PGP PUBLIC KEY BLOCK-----\nVersion: OpenPGP.js v0.7.0\nComment: http://openpgpjs.org\n\nxsBNBFPNt9cBCACcQadV+Gi3UV8NiwCewn5mhC16HT5916kkueeG9A/Xq/O6\ne7+r2JmVAWsuXFGr3ihQ+RVFlganzcjwvAaZpA2+NhrCRjLJy4H6Xi7Oht/g\nguDLQCHkN5MAIGLL/15fjRnPAyb4AXA7j8x1h1Ut0BbOx5VpcuYE2alybYiA\n/FKZTc0EpEqgh/iWU8JPCx3p5ZYgKs66+3yrFP/xwK2js20V5aQI/skuko8g\navaYS/g3nL178men/UQDajiVaIcXPH2TP6EpCxHd5VvBgpBW+DytsJroD/FU\njW0oYVaiAT69VWGLyf+UQiOqsjjgGCentZROXFyx8E+js1yY1Iyr/qcVABEB\nAAHNBlVzZXJJRMLAcgQQAQgAJgUCU8234QYLCQgHAwIJEKt0aeZImxTDBBUI\nAgoDFgIBAhsDAh4BAAATzAgAhXaJpZ+xv/EzBrbr0suwYNOb07goHsOtpRIh\nXCu6kxWdn+i1ItuvrAnLH79qbF6CsXTsxbpK0y+QrQcc2mQ+OUvogn/nSUOl\nXvO7vUZ7KGBHvt75XztWVMMrpUtIYOEkY0piekrxaBoLttY7d1bflu6FMH32\nWRMAi0MhJ0fAlBuAGnr33QTP5w9pBKQuKLBDoIj58NyX+fOO8XZp56mYyIeG\nBpGUMl9zM/1MjXfXU6Bn99fA1jBYVV0Emyp8k6oJuMcpaBUTWa6rN9DCfhGj\nS52CAno6+M0KD0IHGz2x1cvjuQpEPBUP4QRB3ia55ppgRJ6wTZqX/6K7cuUt\nHj0Y0M7ATQRTzbfhAQgAp8yRFirqR7CIqBsAS23O926aJZIIRaUb6G3EM8P2\nPoEhRQmufZBxhIofHpndc3+ZQkQX+JqG6EBBF7t0rSJIMsrtYKOX+WzSJrmx\nMAxQmqpLNBEgCI2/CfSaXoqH76Qy9lAgGAKfyni+LT3FxqgvU0+vQWwmI0EW\n0bBVIg8ni2BuehI89T+z1ldO64BoUYF/dlBI2Pv5l0v5TV5wt3c4POdeMIhQ\nNXwoVa8OjxFBUJ0gVqb1Ak0zRfXNnxK0xPftxU9DaYPgbfhEruMompEOzcal\ng/CBIrXNu3zG1B+jXtQGY5KmjYRG1GFaipRpfUXLZ8AjMEHAZjFxmk9cbQPO\nzQARAQABwsBfBBgBCAATBQJTzbfmCRCrdGnmSJsUwwIbDAAA17AH/ihIVjxa\nmrW3sm0FpypDVGLsBCXtcNk6vDHi+QGVvs00EKzqYMr55wD9Y+2HkYSE9r+x\nOqqb9WGBrAkU7bzVBvFdiHwuXdOQLQNimVnSjLvPWSCs8JZG+UDYSgirc8LS\n+NxFWmsbT7RgSDqi1r4WrhEMmZf3PaIq2lxWeAu9SwVZSay3WCsTAj8/puFT\njwnOSamFbtHOVy7oEhfvcC/SexXfj1lZ7MSnMnkPxY3PIc3ivGXlz2YdojPj\nYHPLUuob7Q3qZU3SMcdB5Q75pURdqF7Zf3Bx45WTlG0CkMiQkFfFNRa+CXJQ\nfUjfcbnrl+Q55Z80iNxM4Obf40lXx0uQ7C0=\n=Ukjk\n-----END PGP PUBLIC KEY BLOCK-----\n\n")

.config(function(
  $provide,
  MAILBOX_PASSWORD_KEY, 
  OAUTH_KEY,

  FAKE_PUBKEY,
  FAKE_ENCPRIVKEY
) {
  $provide.provider("authentication", function AuthenticationProvider(cryptoProvider) {

    // PRIVATE VARIABLES

    var auth = {};
    var baseURL;

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
      if (auth.mailboxPassword) {
        console.log(cryptoProvider);
        cryptoProvider.setMailboxPassword(auth.mailboxPassword);
      }

      auth.data = {
        uid: window.localStorage[OAUTH_KEY+":uid"],
        exp: moment(window.localStorage[OAUTH_KEY+":exp"]),
        access_token: window.localStorage[OAUTH_KEY+":token"]
      };
    };
    
    this.setAPIBaseURL = function(newBaseURL) {
      if (!baseURL) {
        baseURL = newBaseURL;
      }
    };

    this.$get = function($state, $rootScope, $q, $http, $timeout, crypto) {

      // RUN-TIME PUBLIC FUNCTIONS

      var api = {
        // Whether a user is logged in at all
        isLoggedIn: function() { 
          return auth.data && ! _.isUndefined(auth.data.access_token);
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
              if (crypto.setMailboxPassword(FAKE_PUBKEY, FAKE_ENCPRIVKEY, pwd)) {
                savePassword(pwd);

                $rootScope.isLoggedIn = true;
                $rootScope.isLocked = false;

                req.resolve(200);
              } else {
                req.reject({message: "We are unable to decrypt your mailbox, most likely, you entered the wrong decryption password. Please try again."})
              }
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
                saveAuthData(_.pick(data, "access_token", "uid", "expires_in"));

                $rootScope.isLoggedIn = true;
                $rootScope.isLocked = true;

                q.resolve(200);
              }
            });
          }

          return q.promise;
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
