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

    $scope.resetMailbox = function(form) {
        $log.debug('resetMailbox');
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
                $scope.generateNewKeys()
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
            return Reset.getMailboxResetToken();
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
