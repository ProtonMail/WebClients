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
    // Creation Functions
    // ---------------------------------------------------
    // ---------------------------------------------------

    $scope.start = function() {
        $state.go('step1');
    };

    $scope.saveContinue = function(form) {

        if (form.$valid) {

            // custom validation
            if ($scope.account.loginPasswordConfirm!==$scope.account.loginPassword) {
                return;
            }

            networkActivityTracker.track(
                $scope.checkAvailability()
                .then( $scope.generateNewKeys )
                .then( $scope.doCreateUser )
                .then( $scope.doLogUserIn )
                .then( $scope.doDecryptAccessToken )
                .then( $scope.doMailboxLogin )
                .then( $scope.doGetUserInfo )
                .then( $scope.finishRedirect )
                .catch( function(err) {
                    notify({
                        classes: 'notification-danger',
                        message: err
                    });
                    $log.error(err);
                })
            );
        }
    };

    $scope.finish = function(form) {
        $log.debug('finish');
        if (form.$valid) {
            $log.debug('finish: form valid');
            return $scope.generateKeys('UserID', $scope.account.mailboxPassword);
        }
    };

    $scope.finishLoginReset = function(form) {
        $log.debug('finishLoginReset');
    };

    $scope.strength = function(password) {
        var daysToCrack = mellt.CheckPassword(password);
        var word;

        if (daysToCrack < 100) {
            word = 'Very Weak';
        } else if (daysToCrack < 1000) {
            word = 'Weak';
        } else if (daysToCrack < 10000) {
            word = 'Okay';
        } else if (daysToCrack < 100000) {
            word = 'Good';
        } else if (daysToCrack < 1000000) {
            word = 'Strong';
        } else {
            word = 'Very Strong';
        }

        return {
            number: daysToCrack,
            word: word
        };
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

    $scope.checkAvailability = function() {
        var deferred = $q.defer();

        $log.debug('checkAvailability');
        
        User.available({ username: $scope.account.Username }).$promise
        .then(
            function(response) {
                if (response.error) {
                    var error_message = (response.error) ? response.error : (response.statusText) ? response.statusText : 'Error.';
                    $('#Username').focus();
                    deferred.reject(error_message);
                }
                else if (parseInt(response.Available)===0) {
                    $('#Username').focus();
                    deferred.reject('Username already taken.');
                    $log.debug('username taken');
                }
                else {
                    $scope.creating = true;
                    deferred.resolve(200);
                }
            }
        );

        return deferred.promise;
    };

    $scope.generateNewKeys = function() {
        $log.debug('generateNewKeys');
        $scope.genNewKeys   = true;
        var mbpw;
        if ($scope.account.mailboxPasswordConfirm!==undefined) {
            mbpw = $scope.account.mailboxPasswordConfirm;
        }
        else if ($scope.account.mailboxPassword!==undefined) {
            mbpw = $scope.account.mailboxPassword;
        }
        return $scope.generateKeys('UserID', mbpw);
    };

    $scope.doCreateUser = function() {
        $log.debug('doCreateUser');
        $scope.createUser  = true;
        var params = {
            "response_type": "token",
            "client_id": "demoapp",
            "client_secret": "demopass",
            "grant_type": "password",
            "redirect_uri": "https://protonmail.ch",
            "state": "random_string",
            "Username": $scope.account.Username,
            "Password": $scope.account.loginPassword,
            "Email": $scope.account.notificationEmail,
            "News": !!($scope.account.optIn),
            "PublicKey": $scope.account.PublicKey,
            "PrivateKey": $scope.account.PrivateKey,
            "token": "bypass" // this needs to be from their email in the future
        };
        $rootScope.tempUser.username = $scope.account.Username;
        $rootScope.tempUser.password = $scope.account.loginPassword;
        return User.create(params).$promise;
    };

    $scope.doLogUserIn = function() {
        $log.debug('doLogUserIn');
        $log.debug(
            $rootScope.tempUser.username,
            $rootScope.tempUser.password
        );
        $scope.logUserIn   = true;
        return authentication.loginWithCredentials({
            Username: $rootScope.tempUser.username,
            Password: $rootScope.tempUser.password
        });
    };

    $scope.doDecryptAccessToken = function(response) {
        $log.debug('doDecryptAccessToken');
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
                        window.sessionStorage.setItem(CONSTANTS.MAILBOX_PASSWORD_KEY, pmcw.encode_base64($scope.account.mailboxPassword));
                        $state.go("secured.inbox");
                    }
                );
            }
        );
    };

    $scope.doGetUserInfo = function() {
        $log.debug('getUserInfo');
        $scope.getUserInfo  = true;
        return authentication.fetchUserInfo($scope.authResponse.Uid);
    };

    $scope.finishRedirect = function() {
        $log.debug('finishRedirect');
        var deferred = $q.defer();
        $scope.finishCreation = true;
        window.sessionStorage.setItem(
            CONSTANTS.MAILBOX_PASSWORD_KEY,
            pmcw.encode_base64($scope.account.mailboxPassword)
        );
        // delete $rootScope.tempUser;
        // TODO: not all promises are resolved, so we simply refresh.
        $timeout( function() {
            window.location = '/inbox';
        }, 100);
        deferred.resolve(200);
        return deferred.promise;
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
