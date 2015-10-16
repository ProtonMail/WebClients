angular.module("proton.controllers.Account", [
    "proton.tools"
])

.controller("AccountController", function(
    $scope,
    $rootScope,
    $state,
    $stateParams,
    $log,
    $translate,
    $q,
    $timeout,
    $http,
    CONSTANTS,
    authentication,
    networkActivityTracker,
    User,
    Reset,
    pmcw,
    tools,
    notify,
    token
) {
    
    // var mellt = new Mellt();

    $scope.initialization = function() {
        // Variables
        $scope.tools    =           tools;
        $scope.compatibility =      tools.isCompatible();
        $scope.resetMailboxToken =  $rootScope.resetMailboxToken;
        $scope.account = [];

        $scope.process = {};
        $scope.process.generatingKeys =     false;
        $scope.process.savingKeys =         false;
        $scope.process.redirecting =        false;

        $scope.showForm = ($scope.resetMailboxToken!==undefined) ? true : false;
        if ($rootScope.tempUser===undefined) {
            $rootScope.tempUser = [];
        }

        if(angular.isDefined(token) && angular.isDefined(token.data)) {
            $scope.resetToken = token.data.AccessToken;
            $scope.resetUID = token.data.Uid;
        }
    };

    // ---------------------------------------------------
    // ---------------------------------------------------
    // Reset Functions
    // ---------------------------------------------------
    // ---------------------------------------------------

    /**
     * Returns a promise of generated keys from crypto
     * @param email {String}
     * @param mbpw {String}
     * @return {Promise}
     */
    $scope.generateKeys = function(email, mbpw) {
        var deferred = $q.defer();
        $scope.process.genNewKeys = true;
        if (!email) {
            deferred.reject( new Error('generateKeys: Missing email') );
            $scope.process.genNewKeys = false;
        }
        else if (!mbpw) {
            deferred.reject( new Error('generateKeys: Missing mbpw') );
            $scope.process.genNewKeys = false;
        }
        else {
            pmcw.generateKeysRSA(email, mbpw).then(
                function(response) {
                    $scope.account.PublicKey = response.publicKeyArmored;
                    $scope.account.PrivateKey = response.privateKeyArmored;
                    deferred.resolve(response);
                },
                function(err) {
                    $scope.process.genNewKeys = false;
                    $log.error(err);
                    $scope.error = err;
                    deferred.reject(err);
                }
            );
        }

        return deferred.promise;
    };

    /**
     * A chain of promises. Displays errors to the user. 
     * Else: resets mailbox, logs them in and redirects
     * @param form {Reference to the form submitted}
     */
    $scope.resetMailbox = function(form) {
        if (form.$valid) {
            if (
                $rootScope.resetMailboxToken===undefined &&
                $scope.resetMailboxToken===undefined
            ) {
                notify({
                    classes: "notification-danger",
                    message: 'Missing reset token.'
                });
                return;
            }
            networkActivityTracker.track(
                $scope.generateKeys($rootScope.tempUser.username + '@protonmail.com', $scope.account.mailboxPassword)
                .then( $scope.newMailbox )
                .then( $scope.resetMailboxTokenResponse )
                .then( $scope.doLogUserIn )
                .then( $scope.doDecryptAccessToken )
                .then( $scope.doMailboxLogin )
                .catch( function(err) {
                    // TODO exception handling
                    $log.error(err);
                    notify({
                        classes: "notification-danger",
                        message: err.message
                    });
                })
            );
        }
        else {
            notify({
                classes: "notification-danger",
                message: 'Invalid input. Please complete all fields.'
            });
        }
    };

    /**
     * Tries to log the user in. 
     * @return {Promise}
     */
    $scope.doLogUserIn = function() {
        return authentication.loginWithCredentials({
            Username: $rootScope.tempUser.username,
            Password: $rootScope.tempUser.password
        });
    };

    /**
     * Decrypts EncPrivateKey / AccessToken
     * @param response {Object} From the previous chained promise. The response object has the EncPrivateKey as a paramater
     * @return {Promise}
     */
    $scope.doDecryptAccessToken = function(response) {
        $scope.process.savingKeys = true;
        if (!response) {
            var deferred = $q.defer();
            deferred.reject( new Error('Missing Authentication Resposne.') );
            $scope.process.savingKeys = false;
            return deferred.promise;
        }
        else {
            $scope.authResponse = response.data;            
            return pmcw.decryptPrivateKey(
                $scope.authResponse.EncPrivateKey,
                $scope.account.mailboxPassword
            );
        }
    };

    /**
     * Logs the user in and sets auth stuff
     * @return {Redirect} redirects user to inbox on success.
     * TODO: error logging
     */
    $scope.doMailboxLogin = function() {
        return authentication.unlockWithPassword(
            $scope.authResponse.EncPrivateKey,
            $scope.account.mailboxPassword,
            $scope.authResponse.AccessToken,
            $scope.authResponse
        ).then(
            function(response) {
                return authentication.setAuthCookie()
                .then(
                    function(resp) {
                        $scope.process.redirecting = true;
                        $rootScope.isLoggedIn = true;                        
                        window.sessionStorage.setItem(CONSTANTS.MAILBOX_PASSWORD_KEY, pmcw.encode_utf8_base64($scope.account.mailboxPassword));
                        $state.go("secured.inbox");
                    },
                    function(err) {
                        notify({
                            classes: "notification-danger",
                            message: 'doMailboxLogin: Unable to set authCookie.'
                        });
                    }
                );
            },
            function(err) {
                notify({
                    classes: "notification-danger",
                    message: 'doMailboxLogin: Unable to unlock mailbox.'
                });
            }
        );
    };

    /**
     * Verifies the code reset code from the user. Shows a new form on success in the view using flags.
     * TODO: error logging for analytics / rate limiting?
     */
    $scope.verifyResetCode = function() {
        if (
            angular.isUndefined($scope.account.resetMbCode) ||
            $scope.account.resetMbCode.length === 0
        ) {
            notify('Verification Code required');
        }
        else {
            Reset.validateResetToken({
                username: $rootScope.tempUser.username,
                token: $scope.account.resetMbCode
            })
            .then( 
                function(response) {
                    if (response.data.Code!==1000) {
                        notify({
                            classes: 'notification-danger',
                            message: 'Invalid Verification Code.'
                        });
                    }
                    else {
                        $scope.resetMailboxToken = $scope.account.resetMbCode;
                        $scope.showForm = true;
                        $scope.showEmailMessage = false;
                    }
                },
                function(err) {
                    $log.error(err);
                    notify({
                        classes: 'notification-danger',
                        message: 'Unable to verify Reset Token.'
                    });
                }
            );
        }
    };

    /**
     * Initialized in the view. Setups stuff. Depends on if user has recovery email set.
     */
    $scope.resetMailboxInit = function() {

        if(angular.isDefined(token) && angular.isDefined(token.data)) {
            $http.defaults.headers.common.Authorization = "Bearer " + token.data.AccessToken;
            $http.defaults.headers.common["x-pm-uid"] = token.data.Uid;
        }

        /**
         * Request a reset token. Emailed to user (if Notf email is set) otherwise returns from API directly.
         * @return {Response} $HTTP repsonse.  Response will not return a token if emailed. This is handled in the next chained promise.
         * TODO: error logging
         */
        var getMBToken = function() {
            return Reset.getMailboxResetToken({}); // $http API response
        };

        var tokenResponse = function(response) {
            var deferred = $q.defer();
            if (response.data.Error || response.data.Code !== 1000) {
                notify(response);
                $log.error(response);
                deferred.reject(response.data.Error);
            }
            else {
                if (response.data.Token) {
                    $scope.resetMailboxToken = response.data.Token;
                    $scope.showForm = true;
                    deferred.resolve(200);
                }
                else {
                    $scope.showEmailMessage = true;
                    deferred.resolve(200);
                }
            }
            return deferred.promise;
        };

        networkActivityTracker.track(
            getMBToken()
            .then( tokenResponse )
        );
    };

    /**
     * Saves new keys - overriding old, thus resetting the account.
     * @return {Response} $HTTP repsonse. Handled in next chained promise.
     * TODO: error logging
     */
    $scope.newMailbox = function() {
        var resetMBtoken;
        if ($rootScope.resetMailboxToken!==undefined) {
            resetMBtoken = $rootScope.resetMailboxToken;
        }
        if ($scope.resetMailboxToken!==undefined) {
            resetMBtoken = $scope.resetMailboxToken;
        }
        var params = {
            "PublicKey": $scope.account.PublicKey,
            "PrivateKey": $scope.account.PrivateKey,
            "Token": resetMBtoken
        };
        return Reset.resetMailbox(params); // Not to be confused with this local function. Its for the Reset model!
    };

     /**
     * Handles $http response for saving new keys.
     * @return {Promise}
     */
    $scope.resetMailboxTokenResponse = function(response) {
        var promise = $q.defer();
        if (!response) {
            promise.reject( new Error('Connection error: Unable to save new keys.') );
        }
        if (response.status !== 200) {
            notify({
                classes: "notification-danger",
                message: 'Error, try again in a few minutes.'
            });
            $scope.process.generatingKeys = false;
            promise.reject( new Error('Status Error: Unable to save new keys.') );
        }
        else if (response.data.Error) {
            if (response.data.ErrorDescription!=='') {
                notify({
                    classes: "notification-danger",
                    message: response.data.ErrorDescription
                });
                $log.error(response);
                $scope.process.generatingKeys = false;
                promise.reject( new Error(response.data.ErrorDescription) );
            }
            else {
                notify({
                    classes: "notification-danger",
                    message: response.data.Error
                });
                $log.error(response);
                $scope.process.generatingKeys = false;
                promise.reject( new Error(response.data.Error) );
            }
        }
        else {
            $scope.process.generatingKeys = true;
            promise.resolve(200);
        }
        return promise;
    };

    $scope.initialization();

});
