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

        keyPair.then(function(keyPair) {

            setTimeout(function() {

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

                User.createUser(params).$promise.then(function(response) {
                    // Save the Mailbox pass to sessionStorage (backend can't access this)
                    localStorageService.bind($scope, 'protonmail_pw', pmcrypto.encode_utf8_base64(pass));

                    $state.go('secured.inbox');
                }, function(response) {
                    $log.error(response);
                });

                // // Set a cookie via AJAX (must be set via backend because of HTTPOnly flag)
                // $.getJSON("/api/set-cookie/protonmail_pw/true", function(data) {

                //     // Redirect to welcome if its the first time
                //     if ($('#isRegen').val() === 'true') {
                //         setTimeout(function() {
                //             window.location = '/inbox';
                //         }, 2000);
                //     } else {
                //         setTimeout(function() {
                //             window.location = '/welcome';
                //         }, 2000);
                //     }

                // })
            }, 3000);

        });

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
                    // Log the user in
                    authentication.receivedCredentials(
                        _.pick(response, "access_token", "refresh_token", "uid", "expires_in")
                    );
                    $rootScope.isLoggedIn = true;
                    $state.go('step2');
                }, function(response) {
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