angular.module("proton.controllers.Account", ["proton.tools"])

.controller("AccountController", function(
    $scope,
    $rootScope,
    $state,
    $stateParams,
    $log,
    $translate,
    $q,
    authentication,
    networkActivityTracker,
    User,
    pmcw,
    tools,
    localStorageService,
    notify
) {
    // var mellt = new Mellt(); // TODO FIX?

    $scope.compatibility = tools.isCompatible();
    $scope.tools    = tools;
    $scope.creating = false;
    $scope.keyGen   = false;
    $scope.keySave  = false;
    $scope.FetchAcc = false;
    $scope.Verify   = false;
    $scope.Redirect = false;

    $scope.account = [];

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
                $scope.error = err;
                deferred.reject(err);
            }
        );

        keyPair.catch(function(err) {
            deferred.reject(err);
        });

        return deferred.promise;
    }

    $scope.start = function() {
        $state.go('step1');
    };

    $scope.tryDecrypt = function() {
        $('input').blur();
        var mailboxPassword = this.mailboxPassword;
        clearErrors();

        networkActivityTracker.track(
            authentication
            .unlockWithPassword(mailboxPassword)
            .then(
                function() {
                    localStorageService.bind($scope, 'protonmail_pw', pmcw.encode_utf8_base64(mailboxPassword));
                    $state.go("secured.inbox");
                },
                function(err) {
                    $scope.error = err;
                }
            )
        );
    };

    $scope.saveContinue = function(form) {

        if (form.$valid) {

            // custom validation
            if ($scope.account.loginPasswordConfirm!==$scope.account.loginPassword) {
                return;
            }

            $scope.creating = true;

            networkActivityTracker.track(
                User.available({
                    username: $scope.account.Username
                }).$promise.then(
                    function(response) {

                        if (response.error) {
                            var error_message = (response.error) ? response.error : (response.statusText) ? response.statusText : 'Error.';
                            notify({
                                classes: 'notification-danger',
                                message: error_message
                            });
                            return;
                        }

                        return generateKeys('UserID', $scope.account.mailboxPassword).then(
                            function() {

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
                                };

                                $scope.keyGen = true;

                                return User.create(params).$promise.then(
                                    function(response) {

                                        $scope.keySave  = true;

                                        return authentication.loginWithCredentials({
                                            Username: $scope.account.Username,
                                            Password: $scope.account.loginPassword
                                        }).then(
                                            function() {
 
                                                return authentication.fetchUserInfo().then(
                                                    function(user) {

                                                        $scope.FetchAcc = true;

                                                        return authentication.unlockWithPassword($scope.account.mailboxPassword).then(
                                                            function() {

                                                                $scope.Verify   = true;

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
                                                    },
                                                    function(err) {
                                                        $scope.error = err;
                                                    }
                                                );
                                            },
                                            function(err) {
                                                $scope.error = err;
                                            }
                                        );
                                    },
                                    function(response) {
                                        var error_message = (response.error) ? response.error : (response.statusText) ? response.statusText : 'Error.';
                                        notify({
                                            classes: 'notification-danger',
                                            message: error_message
                                        });
                                        $('#Username').focus();
                                        $log.error(response);
                                    }
                                );                                
                            },
                            function(response) {
                                $log.error(response);
                            }
                        );

                    },
                    function(response) {
                        var error_message = (response.error) ? response.error : (response.statusText) ? response.statusText : 'Error.';
                        notify({
                            classes: 'notification-danger',
                            message: error_message
                        });
                    }
                )
            );
            // $state.go('step2');
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
            generateKeys('UserID', form.password.$modelValue);
        }
        // 1. hide the warning, show the form
        // 2. warning to remember hte password
        // 3. API call to reset password
        // 4. on success save, login, redirect
    };

});
