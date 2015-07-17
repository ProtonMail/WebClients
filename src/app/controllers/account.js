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
    };

    $scope.resetMailboxInit = function() {
        authentication.setTokenUID({
            "AccessToken": $rootScope.resetToken, 
            "Uid": $rootScope.resetUID
        });
        setTimeout( function() {
            var promise = Reset.getMailboxResetToken().then(
                function(response) {
                    if (response.data.Error || response.data.Code !== 1000) {
                        notify(response.data.Error);
                    }
                    else {
                        if (response.data.Token) {
                            $rootScope.resetMailboxToken = response.data.Token;
                        }
                        $scope.showForm = true;
                        return;
                    }
                },
                function() {
                    notify('Unable to reset password. Please try again in a few minutes.');
                }
            );
            networkActivityTracker.track(promise);
        }, 2000);
    };

    function generateKeys(userID, pass) {
        var deferred = $q.defer();

        // Generate KeyPair
        var keyPair = pmcw.generateKeysRSA(userID, pass);

        keyPair.then(
            function(response) {
                $scope.account.PublicKey = response.publicKeyArmored;
                $scope.account.PrivateKey = response.privateKeyArmored;
                deferred.resolve(response);
            },
            function(err) {
                $log.error(err);
                $scope.error = err;
                deferred.reject(err);
            }
        );

        return deferred.promise;
    }

    $scope.start = function() {
        $state.go('step1');
    };

    $scope.saveContinue = function(form) {

        if (form.$valid) {

            // custom validation
            if ($scope.account.loginPasswordConfirm!==$scope.account.loginPassword) {
                return;
            }

            // promises
            var checkAvailability = function() {
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

            var genNewKeys = function() {
                console.log('genNewKeys');
                $scope.genNewKeys   = true;
                return generateKeys('UserID', $scope.account.mailboxPassword);
            };

            var createUser = function() {
                console.log('createUser');
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
                return User.create(params).$promise;
            };

            var logUserIn = function() {
                console.log('logUserIn');
                $scope.logUserIn   = true;
                return authentication.loginWithCredentials({
                    Username: $scope.account.Username, 
                    Password: $scope.account.loginPassword
                });
            };

            var decryptAccessToken = function(response) {
                $scope.authResponse = response.data;
                console.log('decryptAccessToken');
                $scope.decryptAccessToken = true;         
                return pmcw.decryptPrivateKey($scope.authResponse.EncPrivateKey, $scope.account.mailboxPassword);
            };

            var mailboxLogin = function() {
                console.log('mailboxLogin');
                $scope.mailboxLogin  = true;
                return authentication.unlockWithPassword($scope.authResponse.EncPrivateKey, $scope.account.mailboxPassword, $scope.authResponse.AccessToken, $scope.authResponse);
            };

            var getUserInfo = function() {
                console.log('getUserInfo');
                $scope.getUserInfo  = true;
                return authentication.fetchUserInfo($scope.authResponse.Uid);
            };

            var finishCreation = function() {
                console.log('finishCreation');
                $scope.finishCreation = true;
                localStorageService.bind($scope, 'protonmail_pw', pmcw.encode_utf8_base64($scope.account.mailboxPassword));
                $timeout( function() {
                    $state.go("secured.inbox");
                }, 500);
            };

            networkActivityTracker.track(
                checkAvailability()
                .then( genNewKeys )
                .then( createUser )
                .then( logUserIn )
                .then( function(response) { decryptAccessToken(response); } )
                .then( mailboxLogin )
                .then( getUserInfo )
                .then( finishCreation )
            );
        }
    };

    $scope.finish = function(form) {
        if (form.$valid) {
            return generateKeys('UserID', $scope.account.mailboxPassword);
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

    $scope.resetMailbox = function(form) {
        if (form.$valid) {

            if ($rootScope.resetMailboxToken===undefined) {
                notify('Missing reset token.');
                return;
            }

            $scope.startGen = true;

            networkActivityTracker.track(
                // TODO: need animation here.
                generateKeys('UserID', $scope.account.mailboxPassword).then(
                    function() {

                        $scope.generationDone   = true;

                        var params = {
                            "PublicKey": $scope.account.PublicKey,
                            "PrivateKey": $scope.account.PrivateKey,
                            "Token": $rootScope.resetMailboxToken
                        };

                        return Reset.resetMailbox(params).then(
                            function(response) {

                                if (response.status !== 200) {
                                    notify('Error, try again in a few minutes.');
                                    $scope.startGen = false;

                                    return;
                                }
                                else if (response.data.Error) {
                                    if (response.data.ErrorDescription!=='') {
                                        notify(response.data.ErrorDescription);
                                        $scope.startGen = false;

                                        return;
                                    }
                                    else {
                                        notify(response.data.Error);
                                        $scope.startGen = false;

                                        return;
                                    }
                                }
                                else {
                                    return authentication.unlockWithPassword($scope.account.mailboxPassword).then(
                                        function() {

                                            $scope.saved   = true;

                                            // var deferred = $q.defer();
                                            // return deferred.promise;

                                            localStorageService.bind($scope, 'protonmail_pw', pmcw.encode_utf8_base64($scope.account.mailboxPassword));

                                            setTimeout( function() {
                                                $scope.Redirect   = true;
                                                $state.go("secured.inbox");
                                            }, 500);
                                        },
                                        function(err) {
                                            $scope.error = err;
                                        }
                                    );
                                }
                            },
                            function(response) {
                                var error_message = (response.data.Error) ? response.data.Error : (response.statusText) ? response.statusText : 'Error.';
                                notify({
                                    classes: 'notification-danger',
                                    message: error_message
                                });
                                $log.error(response);
                            }
                        );
                    },
                    function(response) {
                        $log.error(response);
                    }
                )
            );
        }
        // 1. hide the warning, show the form
        // 2. warning to remember hte password
        // 3. API call to reset password
        // 4. on success save, login, redirect
    };

    $scope.initialization();

});
