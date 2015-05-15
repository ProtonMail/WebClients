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
    pmcrypto,
    tools,
    localStorageService
) {
    var mellt = new Mellt();

    $scope.compatibility = tools.isCompatible();
    $scope.tools = tools; 

    $scope.account = [];

    function generateKeys(userID, pass) {

        // Generate KeyPair
        var keyPair = pmcrypto.generateKeysRSA(userID, pass);

        networkActivityTracker.track(
            keyPair
            .then(
                function(keyPair) {
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
                    User.updateKeypair(params).$promise
                    .then(
                        function(response) {
                            localStorageService.bind($scope, 'protonmail_pw', pmcrypto.encode_utf8_base64(pass));
                            // $state.go('secured.inbox');
                            networkActivityTracker.track(
                                authentication
                                .unlockWithPassword(pass)
                                .then(
                                    function() {
                                        localStorageService.bind($scope, 'protonmail_pw', pmcrypto.encode_utf8_base64(pass));
                                        $state.go("secured.inbox");
                                    },
                                    function(err) {
                                        $scope.error = err;
                                    }
                                )
                            );
                        }, 
                        function(response) {
                            $log.error(response);
                        }
                    )
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
                    localStorageService.bind($scope, 'protonmail_pw', pmcrypto.encode_utf8_base64(mailboxPassword));
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
            // TODO
            // do additional validation here such as looking up the username to see if its available
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
                User.createUser(params).$promise.then(function(response) {
                    // Account created!
                    $state.go('step2');
                    authentication.receivedCredentials(
                        _.pick(response, "access_token", "refresh_token", "uid", "expires_in")
                    );
                    
                }, function(response) {
                    $scope.step1HasError = true;
                    if (response.error) {
                        $scope.step1Error = response.error;
                    }
                    else {
                        $scope.step1Error = 'Unable to create account. Sorry about that.';
                    }
                    $log.error(response);
                })
            );
            // $state.go('step2');
        }
    };

    $scope.finish = function(form) {
        if (form.$valid) {
            generateKeys('UserID', $scope.account.mailboxPassword);
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

});