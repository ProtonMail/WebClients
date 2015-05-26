angular.module("proton.controllers.Account", ["proton.tools"])

.controller("AccountController", function(
    $scope,
    $rootScope,
    $state,
    $stateParams,
    $log,
    authentication,
    networkActivityTracker,
    User,
    pmcw,
    tools,
    localStorageService,
    notify
) {
    var mellt = new Mellt();

    $scope.compatibility = tools.isCompatible();
    $scope.tools = tools;

    $scope.account = [];

    function generateKeys(userID, pass) {

        console.log('generateKeys');

        // Generate KeyPair
        var keyPair = pmcw.generateKeysRSA(userID, pass);

        networkActivityTracker.track(
            keyPair
            .then(
                function(keyPair) {
                    console.log('keyPair');
                    var params = {
                        "response_type": "token",
                        "client_id": "demoapp",
                        "client_secret": "demopass",
                        "grant_type": "password",
                        "redirect_uri": "https://protonmail.ch",
                        "state": "random_string",
                        "username": $scope.account.username,
                        "password": $scope.account.loginPassword,
                        "email": $scope.account.notificationEmail,
                        "news": !!($scope.account.optIn),
                        "public": keyPair.publicKeyArmored,
                        "private": keyPair.privateKeyArmored
                    };
                    return User.updateKeypair(params).$promise
                    .then(
                        function(response) {
                            return authentication.fetchUserInfo()
                            .then(
                                function() {
                                    localStorageService.bind($scope, 'protonmail_pw', pmcw.encode_utf8_base64(pass));
                                    return authentication.unlockWithPassword(pass)
                                    .then(
                                        function() {
                                            console.log('a');
                                            localStorageService.bind($scope, 'protonmail_pw', pmcw.encode_utf8_base64(pass));
                                            console.log('b');
                                            $state.go("secured.inbox");
                                            return;
                                        },
                                        function(err) {
                                            console.log('c');
                                            $scope.error = err;
                                            return;
                                        }
                                    );
                                },
                                function() {

                                }
                            );
                        },
                        function(response) {
                            $log.error(response);
                        }
                    );
                },
                function(err) {
                    $scope.error = err;
                }
            )
        );

        keyPair.catch(function(err) {
            console.error(err);
            alert('Unable to generate keys.');
        });
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


            var params = {
                "response_type": "token",
                "client_id": "demoapp",
                "client_secret": "demopass",
                "grant_type": "password",
                "redirect_uri": "https://protonmail.ch",
                "state": "random_string",
                "username": $scope.account.Username,
                "password": $scope.account.loginPassword,
                "email": $scope.account.notificationEmail,
                "news": !!($scope.account.optIn)
            };

            networkActivityTracker.track(
                User.checkUserExist({
                    username: $scope.account.Username
                })
                .$promise.then(
                    function(response) {

                        if (response.error) {
                            var error_message = (response.error) ? response.error : (response.statusText) ? response.statusText : 'Error.';
                            notify({
                                classes: 'notification-danger',
                                message: error_message
                            });
                            return;
                        }

                        return User.createUser(params).$promise
                        .then(
                            function(response) {
                                // Account created!
                                $state.go('step2');
                                authentication.receivedCredentials(
                                    _.pick(response, "access_token", "refresh_token", "uid", "expires_in")
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
