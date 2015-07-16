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
    Reset,
    pmcw,
    tools,
    localStorageService,
    notify
) {
    var mellt = new Mellt();

    $scope.compatibility = tools.isCompatible();
    $scope.tools    = tools;
    $scope.creating = false;
    $scope.keyGen   = false;
    $scope.keySave  = false;
    $scope.FetchAcc = false;
    $scope.Verify   = false;
    $scope.Redirect = false;

    $scope.account = [];
    $scope.resetMailboxToken = $rootScope.resetMailboxToken;
    if ($scope.resetMailboxToken!==undefined) {
        $scope.showForm = true;
    }
    else {
        $scope.showForm = false;
    }


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

            networkActivityTracker.track(
                User.available({
                    username: $scope.account.Username
                }).$promise.then(
                    function(response) {

                        $scope.creating = true;

                        if (response.error) {
                            var error_message = (response.error) ? response.error : (response.statusText) ? response.statusText : 'Error.';
                            notify({
                                classes: 'notification-danger',
                                message: error_message
                            });
                            $scope.creating = false;
                            $('#Username').focus();
                            return;
                        }
                        else if (parseInt(response.Available)===0) {
                            notify({
                                classes: 'notification-danger',
                                message: 'Username taken.'
                            });
                            $scope.creating = false;
                            $('#Username').focus();
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
                                    "token": "bypass" // this needs to be from their email in the future
                                };

                                $scope.keyGen = true;

                                return User.create(params).$promise.then(
                                    function(response) {

                                        $scope.keySave  = true;

                                        return authentication.loginWithCredentials({
                                            Username: $scope.account.Username,
                                            Password: $scope.account.loginPassword
                                        }).then(
                                            function(response) {

                                                // console.log(response.data);

                                                var EncAccessToken = response.data.AccessToken;
                                                var EncPrivateKey = response.data.EncPrivateKey;
                                                var RefreshToken = response.data.RefreshToken;
                                                var ExpiresIn = response.data.ExpiresIn;
                                                var Uid = response.data.Uid;
                                                var EventID = response.data.EventID;
                                                var mbpw = $scope.account.mailboxPassword;

                                                pmcw.decryptPrivateKey(EncPrivateKey, mbpw)
                                                .then(
                                                    function(resp) {
                                                        var PrivateKey = resp;
                                                        return pmcrypto.decryptMessage(EncAccessToken, PrivateKey)
                                                        .then(
                                                            function(AccessToken) {

                                                                return authentication.unlockWithPassword(EncPrivateKey, $scope.account.mailboxPassword, EncAccessToken, response.data)
                                                                .then(
                                                                    function() {

                                                                        $scope.Verify   = true;


                                                                        return authentication.fetchUserInfo(Uid)
                                                                        .then(

                                                                            function(user) {

                                                                                $scope.FetchAcc = true;

                                                                                localStorageService.bind($scope, 'protonmail_pw', pmcw.encode_utf8_base64($scope.account.mailboxPassword));

                                                                                setTimeout( function() {
                                                                                    $scope.Redirect   = true;
                                                                                    $state.go("secured.inbox");
                                                                                }, 500);

                                                                            },
                                                                            function(err) {
                                                                                console.log(err);
                                                                                $scope.error = err;
                                                                            }
                                                                        );

                                                                        // var deferred = $q.defer();
                                                                        // return deferred.promise;

                                                                    },
                                                                    function(err) {
                                                                        console.log(err);
                                                                        $scope.error = err;
                                                                    }
                                                                );
                                                               
                                                            },
                                                            function(err) {
                                                                console.log(err);
                                                            }
                                                        );
                                                    },
                                                    function(err) {
                                                        console.log(err);
                                                    }
                                                );

                                            },
                                            function(err) {
                                                console.log(err);
                                                $scope.error = err;
                                            }
                                        );
                                    },
                                    function(response) {
                                        console.log(response);
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

});
