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
    authentication,
    networkActivityTracker,
    User,
    Reset,
    pmcw,
    tools,
    localStorageService,
    notify
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
                .then( function(response) { $scope.doDecryptAccessToken(response); } )
                .then( $scope.doMailboxLogin )
                .then( $scope.doGetUserInfo )
                .then( $scope.finishRedirect )
                .catch( function(err) {
                    console.log(err);
                })
            );
        }
    };

    $scope.finish = function(form) {
        if (form.$valid) {
            return $scope.generateKeys('UserID', $scope.account.mailboxPassword);
        }
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
        //var deferred = $q.defer();
        var keyPair = pmcw.generateKeysRSA(userID, pass);
        return keyPair.then(
            function(response) {
                $scope.account.PublicKey = response.publicKeyArmored;
                $scope.account.PrivateKey = response.privateKeyArmored;
                return response;
                //return deferred.resolve(response);
            },
            function(err) {
                $log.error(err);
                $scope.error = err;
                return err;
                //return deferred.reject(err);
            }
        );
    };

    $scope.checkAvailability = function() {
        console.log('checkAvailability');
        return User.available({ username: $scope.account.Username }).$promise
        .then(
            function(response) {
                var promise = $q.defer();
                if (response.error) {
                    var error_message = (response.error) ? response.error : (response.statusText) ? response.statusText : 'Error.';
                    $('#Username').focus();
                    return promise.reject(error_message);
                }
                else if (parseInt(response.Available)===0) {
                    $('#Username').focus();
                    return promise.reject('Username taken.');
                }
                else {
                    $scope.creating = true;
                    return promise.resolve(200);
                }
            }
        );
    };

    $scope.generateNewKeys = function() {
        console.log('generateNewKeys');
        $scope.genNewKeys   = true;
        var mbpw;
        if ($scope.account.mailboxPasswordConfirm!==undefined) {
            mbpw = $scope.account.mailboxPasswordConfirm;
        }
        else if ($scope.account.mailboxPassword!==undefined) {
            mbpw = $scope.account.mailboxPassword;
        }
        console.log(mbpw);
        return $scope.generateKeys('UserID', mbpw);
    };

    $scope.doCreateUser = function() {
        console.log('doCreateUser');
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
        console.log('doLogUserIn', $rootScope.tempUser.username, $rootScope.tempUser.password);
        $scope.logUserIn   = true;
        return authentication.loginWithCredentials({
            Username: $rootScope.tempUser.username,
            Password: $rootScope.tempUser.password
        });
    };

    $scope.doDecryptAccessToken = function(response) {
        $scope.authResponse = response.data;
        console.log('doDecryptAccessToken', $scope.authResponse.EncPrivateKey, $scope.account.mailboxPassword);
        $scope.decryptAccessToken = true;
        return pmcw.decryptPrivateKey($scope.authResponse.EncPrivateKey, $scope.account.mailboxPassword);
    };

    $scope.doMailboxLogin = function() {
        console.log('doMailboxLogin');
        $scope.mailboxLogin  = true;
        return authentication.unlockWithPassword($scope.authResponse.EncPrivateKey, $scope.account.mailboxPassword, $scope.authResponse.AccessToken, $scope.authResponse);
    };

    $scope.doGetUserInfo = function() {
        console.log('getUserInfo');
        $scope.getUserInfo  = true;
        return authentication.fetchUserInfo($scope.authResponse.Uid);
    };

    $scope.finishRedirect = function() {
        var promise = $q.defer();
        console.log('finishCreation');
        $scope.finishCreation = true;
        localStorageService.bind($scope, 'protonmail_pw', pmcw.encode_utf8_base64($scope.account.mailboxPassword));
        delete $rootScope.tempUser;
        $timeout( function() {
            $state.go("secured.inbox");
        }, 100);
        return promise.resolve(200);
    };

    // ---------------------------------------------------
    // ---------------------------------------------------
    // Reset Functions
    // ---------------------------------------------------
    // ---------------------------------------------------

    $scope.resetMailbox = function(form) {
        console.log('resetMailbox');
        if (form.$valid) {
            if ($rootScope.resetMailboxToken===undefined && $scope.resetMailboxToken===undefined) {
                notify('Missing reset token.');
                return;
            }
            console.log($rootScope.tempUser);
            networkActivityTracker.track(
                $scope.generateNewKeys()
                .then( $scope.newMailbox )
                .then( function(response) { $scope.resetMailboxTokenResponse(response); })
                .then( $scope.doLogUserIn )
                .then( function(response) { $scope.doDecryptAccessToken(response); } )
                .then( $scope.doMailboxLogin )
                .then( $scope.finishRedirect )
                .catch( function(err) {
                    console.log(err);
                })
            );
        }
    };

    $scope.verifyResetCode = function(form) {
        if (angular.isUndefined($scope.account.resetMbCode) || $scope.account.resetMbCode.length === 0) {
            notify('Verification Code required');
        } else {
            Reset.validateResetToken({
                username: $rootScope.tempUser.username,
                token: $scope.account.resetMbCode
            })
            .then( function(response) {
                if (response.data.Code!==1000) {
                    notify('Invalid Verification Code.');
                } else {
                    $scope.resetMailboxToken = $scope.account.resetMbCode;
                    $scope.showForm = true;
                    $scope.showEmailMessage = false;
                }
            });
        }
    };

    $scope.resetMailboxInit = function() {
        authentication.setTokenUID({
            "AccessToken": $rootScope.resetToken,
            "Uid": $rootScope.resetUID
        });
        var getMBToken = function() {
            console.log('getMBToken');
            return Reset.getMailboxResetToken();
        };
        var tokenResponse = function(response) {
            console.log('tokenResponse', response);
            var promise = $q.defer();
            if (response.data.Error || response.data.Code !== 1000) {
                notify(response.data.Error);
                promise.reject(response.data.Error);
            }
            else {
                if (response.data.Token) {
                    console.log('No reset email. token received.');
                    $scope.resetMailboxToken = response.data.Token;
                    $scope.showForm = true;
                    promise.resolve(200);
                }
                else {
                    console.log('Check email for token..');
                    $scope.showEmailMessage = true;
                    // set some flag to show email message here.
                    promise.resolve(200);
                }
            }
            return promise;
        };
        networkActivityTracker.track(
            getMBToken()
            .then( function(response) { tokenResponse(response); })
        );
    };

    $scope.newMailbox = function() {
        console.log('newMailbox');
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
        console.log('resetMailboxToken', response);
        var promise = $q.defer();
        if (response.status !== 200) {
            notify('Error, try again in a few minutes.');
            $scope.startGen = false;
            promise.reject('Error, try again in a few minutes.');
        }
        else if (response.data.Error) {
            if (response.data.ErrorDescription!=='') {
                notify(response.data.ErrorDescription);
                $scope.startGen = false;
                promise.reject(response.data.ErrorDescription);
            }
            else {
                notify(response);
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
