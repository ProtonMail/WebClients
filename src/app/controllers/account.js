angular.module("proton.controllers.Account", ["proton.tools"])

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
    var mellt = new Mellt();

    $scope.initialization = function() {
        $log.debug('AccountController:initialization');
        // Variables
        $scope.tools    = tools;
        $scope.compatibility = tools.isCompatible();

        $scope.creating =           false;
        $scope.genNewKeys =         false;
        $scope.createUser =         false;
        $scope.logUserIn =          false;
        $scope.decryptAccessToken = false;
        $scope.mailboxLogin =       false;
        $scope.getUserInfo =        false;
        $scope.finishCreation =     false;

        $scope.account = [];
        $scope.resetMailboxToken = $rootScope.resetMailboxToken;
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

    $scope.generateNewKeys = function(userID) {
        $log.debug('generateNewKeys');
        $scope.genNewKeys   = true;
        var mbpw;
        if ($scope.account.mailboxPasswordConfirm!==undefined) {
            mbpw = $scope.account.mailboxPasswordConfirm;
        }
        else if ($scope.account.mailboxPassword!==undefined) {
            mbpw = $scope.account.mailboxPassword;
        }
        return $scope.generateKeys(userID, mbpw);
    };

    $scope.generateKeys = function(userID, pass) {
        var deferred = $q.defer();

        $log.debug('generateKeys');

        pmcw.generateKeysRSA(userID, pass).then(
            function(response) {
                $log.debug(response);
                $scope.account.PublicKey = response.publicKeyArmored;
                $scope.account.PrivateKey = response.privateKeyArmored;
                $log.debug('pmcw.generateKeysRSA:resolved');
                deferred.resolve(response);
            },
            function(err) {
                $log.error(err);
                $scope.error = err;
                deferred.reject(err);
            }
        );

        return deferred.promise;
    };

    $scope.resetMailbox = function(form) {
        $log.debug('resetMailbox');
        if (form.$valid) {
            $log.debug('resetMailbox:formvalid');
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
                $scope.generateNewKeys($rootScope.tempUser.username + '@protonmail.ch')
                .then( $scope.newMailbox )
                .then( $scope.resetMailboxTokenResponse )
                .then( $scope.doLogUserIn )
                .then( $scope.doDecryptAccessToken )
                .then( $scope.doMailboxLogin )
                .then( $scope.finishRedirect )
                .catch( function(err) {
                    $log.error(err);
                    notify({
                        classes: "notification-danger",
                        message: errr
                    });
                })
            );
        }
    };

    $scope.doLogUserIn = function(response) {
        $log.debug('doLogUserIn', response);
        $log.debug(
            $rootScope.tempUser.username,
            $rootScope.tempUser.password
        );
        return authentication.loginWithCredentials({
            Username: $rootScope.tempUser.username,
            Password: $rootScope.tempUser.password
        });
    };

    $scope.doDecryptAccessToken = function(response) {
        $log.debug('doDecryptAccessToken', response);
        $scope.authResponse = response.data;
        $scope.decryptAccessToken = true;
        return pmcw.decryptPrivateKey(
            $scope.authResponse.EncPrivateKey,
            $scope.account.mailboxPassword
        );
    };

    $scope.doMailboxLogin = function() {
        $log.debug('doMailboxLogin');
        $scope.mailboxLogin  = true;
        return authentication.unlockWithPassword(
            $scope.authResponse.EncPrivateKey,
            $scope.account.mailboxPassword,
            $scope.authResponse.AccessToken,
            $scope.authResponse
        ).then(
            function(response) {
                $log.debug('doMailboxLogin:unlockWithPassword:',response);
                return authentication.setAuthCookie()
                .then(
                    function(resp) {
                        $log.debug('setAuthCookie:resp'+resp);
                        window.sessionStorage.setItem(CONSTANTS.MAILBOX_PASSWORD_KEY, pmcw.encode_utf8_base64($scope.account.mailboxPassword));
                        $state.go("secured.inbox");
                    }
                );
            }
        );
    };

    $scope.finishRedirect = function() {
        $log.debug('finishRedirect');
        var deferred = $q.defer();
        $scope.finishCreation = true;
        $rootScope.isLoggedIn = true;
        window.sessionStorage.setItem(
            CONSTANTS.MAILBOX_PASSWORD_KEY,
            pmcw.encode_utf8_base64($scope.account.mailboxPassword)
        );
        // delete $rootScope.tempUser;
        // TODO: not all promises are resolved, so we simply refresh.
        $state.go('secured.inbox');
        deferred.resolve(200);
        return deferred.promise;
    };

    $scope.verifyResetCode = function(form) {
        $log.debug('verifyResetCode');
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
            .then( function(response) {
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
            });
        }
    };

    $scope.resetMailboxInit = function() {
        $log.debug('resetMailboxInit');
        $log.info(token);
        $http.defaults.headers.common.Authorization = "Bearer " + token.data.AccessToken;
        $http.defaults.headers.common["x-pm-uid"] = token.data.Uid;

        var getMBToken = function() {
            $log.debug('getMBToken');
            return Reset.getMailboxResetToken({});
        };
        var tokenResponse = function(response) {
            $log.debug('tokenResponse', response);
            var deferred = $q.defer();
            if (response.data.Error || response.data.Code !== 1000) {
                notify(response);
                $log.error(response);
                deferred.reject(response.data.Error);
            }
            else {
                if (response.data.Token) {
                    $log.debug('No reset email. token received.');
                    $scope.resetMailboxToken = response.data.Token;
                    $scope.showForm = true;
                    deferred.resolve(200);
                }
                else {
                    $log.debug('Check email for token..');
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

    $scope.newMailbox = function() {
        $log.debug('newMailbox');
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
        return Reset.resetMailbox(params);
    };

    $scope.resetMailboxTokenResponse = function(response) {
        $log.debug('resetMailboxTokenResponse');
        var promise = $q.defer();
        if (response.status !== 200) {
            notify({
                classes: "notification-danger",
                message: 'Error, try again in a few minutes.'
            });
            $scope.startGen = false;
            promise.reject('Error, try again in a few minutes.');
        }
        else if (response.data.Error) {
            if (response.data.ErrorDescription!=='') {
                notify(response.data.ErrorDescription);
                $log.error(response);
                $scope.startGen = false;
                promise.reject(response.data.ErrorDescription);
            }
            else {
                notify(response);
                $log.error(response);
                $scope.startGen = false;
                promise.reject(response);
            }
        }
        else {
            promise.resolve(200);
        }
        return promise;
    };

    $scope.initialization();

});
